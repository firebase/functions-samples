# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from datetime import datetime, timedelta
import json

from firebase_admin import auth, firestore, initialize_app
from firebase_functions import https_fn, identity_fn, tasks_fn, options, params

import google.auth
import google.auth.transport.requests
import google.cloud.firestore
import google.cloud.tasks_v2
import google.oauth2.credentials
import googleapiclient.discovery

initialize_app()


# [START savegoogletoken]
@identity_fn.before_user_created()
def savegoogletoken(
    event: identity_fn.AuthBlockingEvent,
) -> identity_fn.BeforeCreateResponse | None:
    """During sign-up, save the Google OAuth2 access token and queue up a task
    to schedule an onboarding session on the user's Google Calendar.

    You will only get an access token if you enabled it in your project's blocking
    functions settings in the Firebase console:

    https://console.firebase.google.com/project/_/authentication/settings
    """
    if event.credential is not None and event.credential.provider_id == "google.com":
        print(f"Signed in with {event.credential.provider_id}. Saving access token.")

        firestore_client: google.cloud.firestore.Client = firestore.client()
        doc_ref = firestore_client.collection("user_info").document(event.data.uid)
        doc_ref.set(
            {"calendar_access_token": event.credential.access_token}, merge=True
        )

        tasks_client = google.cloud.tasks_v2.CloudTasksClient()
        task_queue = tasks_client.queue_path(
            params.PROJECT_ID.value(),
            options.SupportedRegion.US_CENTRAL1,
            "scheduleonboarding",
        )
        target_uri = get_function_url("scheduleonboarding")
        calendar_task = google.cloud.tasks_v2.Task(
            http_request={
                "http_method": google.cloud.tasks_v2.HttpMethod.POST,
                "url": target_uri,
                "headers": {"Content-type": "application/json"},
                "body": json.dumps({"data": {"uid": event.data.uid}}).encode(),
            },
            schedule_time=datetime.now() + timedelta(minutes=1),
        )
        tasks_client.create_task(parent=task_queue, task=calendar_task)


# [END savegoogletoken]


# [START scheduleonboarding]
@tasks_fn.on_task_dispatched()
def scheduleonboarding(request: tasks_fn.CallableRequest) -> https_fn.Response:
    """Add an onboarding event to a user's Google Calendar.

    Retrieves and deletes the access token that was saved to Cloud Firestore.
    """

    if "uid" not in request.data:
        return https_fn.Response(
            status=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            response="No user specified.",
        )
    uid = request.data["uid"]

    user_record: auth.UserRecord = auth.get_user(uid)
    if user_record.email is None:
        return https_fn.Response(
            status=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            response="No email address on record.",
        )

    firestore_client: google.cloud.firestore.Client = firestore.client()
    user_info = firestore_client.collection("user_info").document(uid).get().to_dict()
    if "calendar_access_token" not in user_info:
        return https_fn.Response(
            status=https_fn.FunctionsErrorCode.PERMISSION_DENIED,
            response="No Google OAuth token found.",
        )
    calendar_access_token = user_info["calendar_access_token"]
    firestore_client.collection("user_info").document(uid).update(
        {"calendar_access_token": google.cloud.firestore.DELETE_FIELD}
    )

    google_credentials = google.oauth2.credentials.Credentials(
        token=calendar_access_token
    )

    calendar_client = googleapiclient.discovery.build(
        "calendar", "v3", credentials=google_credentials
    )
    calendar_event = {
        "summary": "Onboarding with ExampleCo",
        "location": "Video call",
        "description": "Walk through onboarding tasks with an ExampleCo engineer.",
        "start": {
            "dateTime": (datetime.now() + timedelta(days=3)).isoformat(),
            "timeZone": "America/Los_Angeles",
        },
        "end": {
            "dateTime": (datetime.now() + timedelta(days=3, hours=1)).isoformat(),
            "timeZone": "America/Los_Angeles",
        },
        "attendees": [
            {"email": user_record.email},
            {"email": "onboarding@example.com"},
        ],
    }
    calendar_client.events().insert(calendarId="primary", body=calendar_event).execute()


# [END scheduleonboarding]


def get_function_url(
    name: str, location: str = options.SupportedRegion.US_CENTRAL1
) -> str:
    """Get the URL of a given v2 cloud function.

    Params:
        name: the function's name
        location: the function's location

    Returns:
        The URL of the function
    """
    credentials, project_id = google.auth.default(
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    authed_session = google.auth.transport.requests.AuthorizedSession(credentials)
    url = (
        "https://cloudfunctions.googleapis.com/v2beta/"
        + f"projects/{project_id}/locations/{location}/functions/{name}"
    )
    response = authed_session.get(url)
    data = response.json()
    function_url = data["serviceConfig"]["uri"]
    return function_url
