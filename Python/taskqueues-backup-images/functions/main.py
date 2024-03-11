# Copyright 2023 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# [START v2imports]
# Dependencies for task queue functions.
from google.cloud import tasks_v2
import requests
from firebase_functions.options import RetryConfig, RateLimits, SupportedRegion

# Dependencies for image backup.
from datetime import datetime, timedelta
import json
import pathlib
from urllib.parse import urlparse
from firebase_admin import initialize_app, storage, functions
from firebase_functions import https_fn, tasks_fn, params
import google.auth
from google.auth.transport.requests import AuthorizedSession
# [END v2imports]

app = initialize_app()

BACKUP_START_DATE = datetime(1995, 6, 17)
BACKUP_COUNT = params.IntParam("BACKUP_COUNT", default=100).value
HOURLY_BATCH_SIZE = params.IntParam("HOURLY_BATCH_SIZE", default=600).value
BACKUP_BUCKET = params.StringParam(
    "BACKUP_BUCKET", input=params.ResourceInput(type=params.ResourceType.STORAGE_BUCKET)).value
NASA_API_KEY = params.StringParam("NASA_API_KEY").value


# [START v2TaskFunctionSetup]
@tasks_fn.on_task_dispatched(retry_config=RetryConfig(max_attempts=5, min_backoff_seconds=60),
                             rate_limits=RateLimits(max_concurrent_dispatches=10))
def backupapod(req: tasks_fn.CallableRequest) -> str:
    """Grabs Astronomy Photo of the Day (APOD) using NASA's API."""
# [END v2TaskFunctionSetup]
    try:
        date = req.data["date"]
    except KeyError:
        raise https_fn.HttpsError(code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                                  message="Invalid payload. Must include date.")

    print(f"Requesting data from APOD API for date {date}")
    api_resp = requests.get(url="https://api.nasa.gov/planetary/apod",
                            params={
                                "date": date,
                                "api_key": NASA_API_KEY
                            })
    if not api_resp.ok:
        print(f"Request to NASA APOD API failed with reponse {api_resp.status_code}")
        match api_resp.status_code:
            case 404:  # APOD not published for the day. This is fine!
                print("No APOD today.")
                return "No APOD today."
            case 500:
                raise https_fn.HttpsError(code=https_fn.FunctionsErrorCode.UNAVAILABLE,
                                          message="APOD API temporarily not available.")
            case _:
                raise https_fn.HttpsError(code=https_fn.FunctionsErrorCode.INTERNAL,
                                          message="Uh-oh. Something broke.")
    apod = api_resp.json()
    pic_url = apod["hdurl"]

    print(f"Got URL {pic_url} from NASA API for date {date}. Fetching...")
    pic_resp = requests.get(pic_url)
    pic_type = pic_resp.headers.get("Content-Type")
    if pic_type is None:
        pic_type = "image/jpeg"

    print("Uploading to Cloud Storage")
    bucket = storage.bucket(BACKUP_BUCKET)
    ext = pathlib.PurePosixPath(urlparse(pic_url).path).suffix
    pic_blob = bucket.blob(f"apod/{date}{ext}")
    try:
        pic_blob.upload_from_string(pic_resp.content, content_type=pic_type)
    except:
        raise https_fn.HttpsError(code=https_fn.FunctionsErrorCode.INTERNAL,
                                  message="Uh-oh. Something broke.")

    print(f"Saved {pic_url}")
    return f"Saved {pic_url}"


# [START v2EnqueueTasks]
@https_fn.on_request()
def enqueuebackuptasks(_: https_fn.Request) -> https_fn.Response:
    """Adds backup tasks to a Cloud Tasks queue."""
    task_queue = functions.task_queue("backupapod")
    target_uri = get_function_url("backupapod")

    for i in range(BACKUP_COUNT):
        batch = i // HOURLY_BATCH_SIZE

        # Delay each batch by N hours
        schedule_delay = timedelta(hours=batch)
        schedule_time = datetime.now() + schedule_delay

        dispatch_deadline_seconds = 60 * 5  # 5 minutes

        backup_date = BACKUP_START_DATE + timedelta(days=i)
        body = {"data": {"date": backup_date.isoformat()[:10]}}
        task_options = functions.TaskOptions(schedule_time=schedule_time,
                                             dispatch_deadline_seconds=dispatch_deadline_seconds,
                                             uri=target_uri)
        task_queue.enqueue(body, task_options)
    return https_fn.Response(status=200, response=f"Enqueued {BACKUP_COUNT} tasks")
# [END v2EnqueueTasks]


# [START v2GetFunctionUri]
def get_function_url(name: str, location: str = SupportedRegion.US_CENTRAL1) -> str:
    """Get the URL of a given v2 cloud function.

    Params:
        name: the function's name
        location: the function's location

    Returns: The URL of the function
    """
    credentials, project_id = google.auth.default(
        scopes=["https://www.googleapis.com/auth/cloud-platform"])
    authed_session = AuthorizedSession(credentials)
    url = ("https://cloudfunctions.googleapis.com/v2beta/" +
           f"projects/{project_id}/locations/{location}/functions/{name}")
    response = authed_session.get(url)
    data = response.json()
    function_url = data["serviceConfig"]["uri"]
    return function_url
# [END v2GetFunctionUri]
