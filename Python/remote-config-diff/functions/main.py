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
# [START import]
# The Cloud Functions for Firebase SDK to set up triggers and logging.
from firebase_functions import remote_config_fn

# The Firebase Admin SDK to obtain access tokens.
import firebase_admin

app = firebase_admin.initialize_app()

import deepdiff
import requests
# [END import]


# [START showconfigdiff]
@remote_config_fn.on_config_updated()
def showconfigdiff(event: remote_config_fn.CloudEvent[remote_config_fn.ConfigUpdateData]) -> None:
    """Log the diff of the most recent Remote Config template change."""

    # Obtain an access token from the Admin SDK
    access_token = app.credential.get_access_token().access_token

    # Get the version number from the event object
    current_version = int(event.data.version_number)

    # Figure out the differences between templates
    remote_config_api = ("https://firebaseremoteconfig.googleapis.com/v1/"
                         f"projects/{app.project_id}/remoteConfig")
    current_template = requests.get(remote_config_api,
                                    params={"versionNumber": current_version},
                                    headers={"Authorization": f"Bearer {access_token}"})
    previous_template = requests.get(remote_config_api,
                                     params={"versionNumber": current_version - 1},
                                     headers={"Authorization": f"Bearer {access_token}"})
    diff = deepdiff.DeepDiff(previous_template, current_template)

    # Log the difference
    print(diff.pretty())
# [END showconfigdiff]
# [END all]
