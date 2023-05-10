# Copyright 2022 Google Inc. All Rights Reserved.
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

# [START all]
# [START import]
# The Cloud Functions for Firebase SDK to set up triggers and logging.
from firebase_functions import test_lab_fn, params

# The requests library to send web requests to Slack.
import requests

# [END import]


# [START postToSlack]
SLACK_WEBHOOK_URL = params.SecretParam("SLACK_WEBHOOK_URL")


def post_to_slack(title: str, details: str) -> requests.Response:
    """Posts a message to Slack via a Webhook."""
    return requests.post(
        SLACK_WEBHOOK_URL.value(),
        json={
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": title,
                    },
                },
                {
                    "type": "divider",
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": details,
                    },
                },
            ],
        },
    )


# [END postToSlack]


# [START getSlackmoji]
def slackmoji(
    status: test_lab_fn.TestState | test_lab_fn.OutcomeSummary,
) -> str:
    """Convert a test result status into a Slackmoji."""
    status_slackmoji: dict[
        test_lab_fn.TestState | test_lab_fn.OutcomeSummary, str
    ] = {
        test_lab_fn.OutcomeSummary.SUCCESS: ":tada:",
        test_lab_fn.OutcomeSummary.FAILURE: ":broken_heart:",
        test_lab_fn.OutcomeSummary.INCONCLUSIVE: ":question:",
        test_lab_fn.OutcomeSummary.SKIPPED: ":arrow_heading_down:",
        test_lab_fn.TestState.VALIDATING: ":thought_balloon:",
        test_lab_fn.TestState.PENDING: ":soon:",
        test_lab_fn.TestState.FINISHED: ":white_check_mark:",
        test_lab_fn.TestState.ERROR: ":red_circle:",
        test_lab_fn.TestState.INVALID: ":large_orange_diamond:",
    }
    return status_slackmoji[status] if status in status_slackmoji else ""


# [END getSlackmoji]


# [START posttestresultstoslack]
@test_lab_fn.on_test_matrix_completed(secrets=["SLACK_WEBHOOK_URL"])
def posttestresultstoslack(
    event: test_lab_fn.CloudEvent[test_lab_fn.TestMatrixCompletedData],
) -> None:
    """Posts a test matrix result to Slack."""

    # Obtain Test Matrix properties from the CloudEvent
    test_matrix_id = event.data.test_matrix_id
    state = event.data.state
    outcome_summary = event.data.outcome_summary

    # Create the title of the message
    title = f"{slackmoji(state)} {slackmoji(outcome_summary)} {test_matrix_id}"

    # Create the details of the message
    details = (
        f"Status: *{state}* {slackmoji(state)}\n"
        f"Outcome: *{outcome_summary}* {slackmoji(outcome_summary)}"
    )

    # Post the message to Slack
    response = post_to_slack(title, details)

    # Log the response
    print(response.status_code, response.text)


# [END posttestresultstoslack]
# [END all]
