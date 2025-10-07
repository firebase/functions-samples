# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import requests
import base64
from firebase_functions import options
from firebase_functions.alerts.app_distribution_fn import (
    on_in_app_feedback_published,
    InAppFeedbackEvent,
)
from firebase_functions.params import (
    StringParam,
    IntParam,
    SecretParam,
)

# The keys are either defined in .env or they are created
# via prompt in the CLI before deploying
JIRA_URI = StringParam(
    "JIRA_URI",
    description="URI of your Jira instance (e.g. 'https://mysite.atlassian.net')",
    input={
        "text": {
            "validation_regex": r"^https://.*",
            "validation_error_message": "Please enter an 'https://' URI",
        }
    },
)
PROJECT_KEY = StringParam("PROJECT_KEY",
                          description="Project key of your Jira instance (e.g. 'XY')")
ISSUE_TYPE_ID = IntParam(
    "ISSUE_TYPE_ID",
    description="Issue type ID for the Jira issues being created",
    default=10001,
)
ISSUE_LABEL = StringParam(
    "ISSUE_LABEL",
    description="Label for the Jira issues being created",
    default="in-app",
)
API_TOKEN_OWNER = StringParam(
    "API_TOKEN_OWNER",
    description="Owner of the Jira API token",
    input={
        "text": {
            "validation_regex":
                r"^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$",
            "validation_error_message":
                "Please enter a valid email address",
        }
    },
)
API_TOKEN = SecretParam(
    "API_TOKEN",
    description="Jira API token. Created using "
    "https://id.atlassian.com/manage-profile/security/api-tokens",
)


@on_in_app_feedback_published(secrets=[API_TOKEN])
def handle_in_app_feedback(event: InAppFeedbackEvent):
    issue_uri = create_issue(event)
    if event.data.payload.screenshot_uri:
        upload_screenshot(issue_uri, event.data.payload.screenshot_uri)


def auth_header():
    """Creates "Authorization" header value."""
    token = f"{API_TOKEN_OWNER.value()}:{API_TOKEN.value()}"
    return "Basic " + base64.b64encode(token.encode("utf-8")).decode("utf-8")


def create_issue(event: InAppFeedbackEvent):
    """Creates new issue in Jira."""
    request_json = build_create_issue_request(event)
    response = requests.post(
        f"{JIRA_URI.value()}/rest/api/3/issue",
        headers={
            "Authorization": auth_header(),
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        json=request_json,
    )
    if not response.ok:
        raise Exception(
            f"Issue creation failed: {response.status_code} {response.reason} for {request_json}")
    return response.json()["self"]  # issueUri


def upload_screenshot(issue_uri: str, screenshot_uri: str):
    """Uploads screenshot to Jira (after downloading it from Firebase)."""
    dl_response = requests.get(screenshot_uri)
    if not dl_response.ok:
        raise Exception(
            f"Screenshot download failed: {dl_response.status_code} {dl_response.reason}")
    blob = dl_response.content
    files = {"file": ("screenshot.png", blob, "image/png")}
    ul_response = requests.post(
        f"{issue_uri}/attachments",
        headers={
            "Authorization": auth_header(),
            "Accept": "application/json",
            "X-Atlassian-Token": "no-check",
        },
        files=files,
    )
    if not ul_response.ok:
        raise Exception(f"Screenshot upload failed: {ul_response.status_code} {ul_response.reason}")


def lookup_reporter(tester_email: str):
    """Looks up Jira user ID."""
    response = requests.get(
        f"{JIRA_URI.value()}/rest/api/3/user/search?query={tester_email}",
        headers={
            "Authorization": auth_header(),
            "Accept": "application/json"
        },
    )
    if not response.ok:
        print(
            f"Failed to find Jira user for '{tester_email}': {response.status_code} {response.reason}"
        )
        return None
    json = response.json()
    return json[0]["accountId"] if len(json) > 0 else None


def build_create_issue_request(event: InAppFeedbackEvent):
    """Builds payload for creating a Jira issue."""
    summary = "In-app feedback: " + event.data.payload.text
    summary = summary.splitlines()[0]
    if len(summary) > 40:
        summary = summary[:39] + "…"
    json = {
        "update": {},
        "fields": {
            "summary": summary,
            "issuetype": {
                "id": str(ISSUE_TYPE_ID.value())
            },
            "project": {
                "key": PROJECT_KEY.value()
            },
            "description": {
                "type":
                    "doc",
                "version":
                    1,
                "content": [
                    {
                        "type":
                            "paragraph",
                        "content": [
                            {
                                "text": "Firebase App ID: ",
                                "type": "text",
                                "marks": [{
                                    "type": "strong"
                                }],
                            },
                            {
                                "text": event.app_id,
                                "type": "text"
                            },
                        ],
                    },
                    {
                        "type":
                            "paragraph",
                        "content": [
                            {
                                "text": "App Version: ",
                                "type": "text",
                                "marks": [{
                                    "type": "strong"
                                }],
                            },
                            {
                                "text": event.data.payload.app_version,
                                "type": "text"
                            },
                        ],
                    },
                    {
                        "type":
                            "paragraph",
                        "content": [
                            {
                                "text": "Tester Email: ",
                                "type": "text",
                                "marks": [{
                                    "type": "strong"
                                }],
                            },
                            {
                                "text": event.data.payload.tester_email,
                                "type": "text"
                            },
                        ],
                    },
                    {
                        "type":
                            "paragraph",
                        "content": [
                            {
                                "text": "Tester Name: ",
                                "type": "text",
                                "marks": [{
                                    "type": "strong"
                                }],
                            },
                            {
                                "text": event.data.payload.tester_name or "None",
                                "type": "text",
                            },
                        ],
                    },
                    {
                        "type":
                            "paragraph",
                        "content": [
                            {
                                "text": "Feedback text: ",
                                "type": "text",
                                "marks": [{
                                    "type": "strong"
                                }],
                            },
                            {
                                "text": event.data.payload.text,
                                "type": "text"
                            },
                        ],
                    },
                    {
                        "type":
                            "paragraph",
                        "content": [{
                            "text":
                                "Console link",
                            "type":
                                "text",
                            "marks": [{
                                "type": "link",
                                "attrs": {
                                    "href": event.data.payload.feedback_console_uri,
                                    "title": "Firebase console",
                                },
                            }],
                        }],
                    },
                ],
            },
            "labels": [ISSUE_LABEL.value()],
        },
    }
    reporter = lookup_reporter(event.data.payload.tester_email)
    if reporter:
        json["fields"]["reporter"] = {"id": reporter}
    return json
