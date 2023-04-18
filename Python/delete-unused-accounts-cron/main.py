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

# [START all]
from datetime import datetime, timedelta

# [START import]
# The Cloud Functions for Firebase SDK to set up triggers and logging.
from firebase_functions import scheduler_fn

# The Firebase Admin SDK to delete users.
import firebase_admin
from firebase_admin import auth

firebase_admin.initialize_app()
# [END import]


# [START accountcleanup]
# Run once a day at midnight, to clean up inactive users.
# Manually run the task here https://console.cloud.google.com/cloudscheduler
@scheduler_fn.on_schedule("every day 00:00")
def accountcleanup(event: scheduler_fn.ScheduledEvent) -> None:
    """Delete users who've been inactive for 30 days or more."""
    user_page: auth.ListUsersPage = auth.list_users()
    while user_page is not None:
        inactive_uids = [
            user.uid
            for user in user_page.users
            if is_inactive(user, timedelta(days=30))
        ]
        auth.delete_users(inactive_uids)
        user_page = user_page.get_next_page()
# [END accountcleanup]


def is_inactive(user: auth.UserRecord, inactive_limit: timedelta) -> bool:
    if user.user_metadata.last_refresh_timestamp is not None:
        last_seen_timestamp = user.user_metadata.last_refresh_timestamp / 1000
    elif user.user_metadata.last_sign_in_timestamp is not None:
        last_seen_timestamp = user.user_metadata.last_sign_in_timestamp / 1000
    elif user.user_metadata.creation_timestamp is not None:
        last_seen_timestamp = user.user_metadata.creation_timestamp / 1000
    else:
        raise ValueError
    last_seen = datetime.fromtimestamp(last_seen_timestamp)
    inactive_time = datetime.now() - last_seen
    return inactive_time >= inactive_limit
# [END all]
