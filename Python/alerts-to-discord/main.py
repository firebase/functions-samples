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

import pprint

# [START v2import]
from firebase_functions import params
from firebase_functions.alerts import (
    app_distribution_fn,
    crashlytics_fn,
    performance_fn,
)

# [END v2import]

import requests

DISCORD_WEBHOOK_URL = params.SecretParam("DISCORD_WEBHOOK_URL")


def post_message_to_discord(
    bot_name: str, message_body: str, webhook_url: str
) -> requests.Response:
    """Posts a message to Discord with Discord's Webhook API.

    Params:
        bot_name: The bot username to display
        message_body: The message to post (Discord Markdown)
    """
    if webhook_url == "":
        raise EnvironmentError(
            "No webhook URL found. Set the Discord Webhook URL before deploying. "
            "Learn more about Discord webhooks here: "
            "https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks"
        )

    return requests.post(
        url=webhook_url,
        json={
            # Here's what the Discord API supports in the payload:
            # https://discord.com/developers/docs/resources/webhook#execute-webhook-jsonform-params
            "username": bot_name,
            "content": message_body,
        },
    )


# [START v2Alerts]
# [START v2CrashlyticsAlertTrigger]
@crashlytics_fn.on_new_fatal_issue_published(secrets=["DISCORD_WEBHOOK_URL"])
def post_fatal_issue_to_discord(
    event: crashlytics_fn.CrashlyticsNewFatalIssueEvent,
) -> None:
    """Publishes a message to Discord whenever a new Crashlytics fatal issue occurs."""
    # [END v2CrashlyticsAlertTrigger]
    # [START v2CrashlyticsEventPayload]
    # Construct a helpful message to send to Discord.
    app_id = event.app_id
    issue = event.data.payload.issue
    message = f"""
🚨 New fatal issue for {app_id} in version {issue.app_version} 🚨

# {issue.title}

{issue.subtitle}

ID: `{issue.id}`
""".strip()
    # [END v2CrashlyticsEventPayload]

    try:
        # [START v2SendToDiscord]
        response = post_message_to_discord(
            "Crashlytics Bot", message, DISCORD_WEBHOOK_URL.value()
        )
        if response.ok:
            print(f"Posted fatal Crashlytics alert {issue.id} for {app_id} to Discord.")
            pprint.pp(event.data.payload)
        else:
            response.raise_for_status()
        # [END v2SendToDiscord]
    except (EnvironmentError, requests.HTTPError) as error:
        print(
            f"Unable to post fatal Crashlytics alert {issue.id} for {app_id} to Discord.",
            error,
        )


# [START v2AppDistributionAlertTrigger]
@app_distribution_fn.on_new_tester_ios_device_published(secrets=["DISCORD_WEBHOOK_URL"])
def post_new_udid_to_discord(event: app_distribution_fn.NewTesterDeviceEvent) -> None:
    """Publishes a message to Discord whenever someone registers a new iOS test device."""
    # [END v2AppDistributionAlertTrigger]
    # [START v2AppDistributionEventPayload]
    # Construct a helpful message to send to Discord.
    app_id = event.app_id
    app_dist = event.data.payload
    message = f"""
📱 New iOS device registered by {app_dist.tester_name} <{app_dist.tester_email}> for {app_id}

UDID **{app_dist.device_id}** for {app_dist.device_model}
""".strip()
    # [END v2AppDistributionEventPayload]

    try:
        # [START v2SendNewTesterIosDeviceToDiscord]
        response = post_message_to_discord(
            "App Distro Bot", message, DISCORD_WEBHOOK_URL.value()
        )
        if response.ok:
            print(
                f"Posted iOS device registration alert for {app_dist.tester_email} to Discord."
            )
            pprint.pp(event.data.payload)
        else:
            response.raise_for_status()
        # [END v2SendNewTesterIosDeviceToDiscord]
    except (EnvironmentError, requests.HTTPError) as error:
        print(
            f"Unable to post iOS device registration alert for {app_dist.tester_email} to Discord.",
            error,
        )


# [START v2PerformanceAlertTrigger]
@performance_fn.on_threshold_alert_published(secrets=["DISCORD_WEBHOOK_URL"])
def post_performance_alert_to_discord(
    event: performance_fn.PerformanceThresholdAlertEvent,
) -> None:
    """Publishes a message to Discord whenever a performance threshold alert is fired."""
    # [END v2PerformanceAlertTrigger]
    # [START v2PerformanceEventPayload]
    # Construct a helpful message to send to Discord.
    app_id = event.app_id
    perf = event.data.payload
    message = f"""
⚠️ Performance Alert for {perf.metric_type} of {perf.event_type}: **{perf.event_name}** ⚠️

App ID: {app_id}
Alert condition: {perf.threshold_value} {perf.threshold_unit}
Percentile (if applicable): {perf.condition_percentile}
App version (if applicable): {perf.app_version}

Violation: {perf.violation_value} {perf.violation_unit}
Number of samples checked: {perf.num_samples}

**Investigate more:** {perf.investigate_uri}
""".strip()
    # [END v2PerformanceEventPayload]

    try:
        # [START v2SendPerformanceAlertToDiscord]
        response = post_message_to_discord(
            "App Performance Bot", message, DISCORD_WEBHOOK_URL.value()
        )
        if response.ok:
            print(f"Posted Firebase Performance alert {perf.event_name} to Discord.")
            pprint.pp(event.data.payload)
        else:
            response.raise_for_status()
        # [END v2SendPerformanceAlertToDiscord]
    except (EnvironmentError, requests.HTTPError) as error:
        print(
            f"Unable to post Firebase Performance alert {perf.event_name} to Discord.",
            error,
        )


# [END v2Alerts]
