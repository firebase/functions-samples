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

from firebase_admin import firestore, initialize_app
import google.cloud.firestore

from firebase_functions import identity_fn, https_fn

initialize_app()


# [START v2ValidateNewUser]
# [START v2beforeCreateFunctionTrigger]
# Block account creation with any non-acme email address.
@identity_fn.before_user_created()
def validatenewuser(
    event: identity_fn.AuthBlockingEvent
) -> identity_fn.BeforeCreateResponse | None:
# [END v2beforeCreateFunctionTrigger]
    # [START v2readUserData]
    # User data passed in from the CloudEvent.
    user = event.data
    # [END v2readUserData]

    # [START v2domainHttpsError]
    # Only users of a specific domain can sign up.
    if user.email is None or "@acme.com" not in user.email:
        # Return None so that Firebase Auth rejects the account creation.
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="Unauthorized email",
        )
    # [END v2domainHttpsError]
# [END v2ValidateNewUser]


# [START v2CheckForBan]
# [START v2beforeSignInFunctionTrigger]
# Block account sign in with any banned account.
@identity_fn.before_user_signed_in()
def checkforban(
    event: identity_fn.AuthBlockingEvent
) -> identity_fn.BeforeSignInResponse | None:
# [END v2beforeSignInFunctionTrigger]
    # [START v2readEmailData]
    # Email passed from the CloudEvent.
    email = event.data.email if event.data.email is not None else ""
    # [END v2readEmailData]

    # [START v2documentGet]
    # Obtain a document in Firestore of the banned email address.
    firestore_client: google.cloud.firestore.Client = firestore.client()
    doc = firestore_client.collection("banned").document(email).get()
    # [END v2documentGet]

    # [START v2bannedHttpsError]
    # Checking that the document exists for the email address.
    if doc.exists:
        # Throw an HttpsError so that Firebase Auth rejects the account sign in.
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="Unauthorized email",
        )
    # [END v2bannedHttpsError]
# [START v2CheckForBan]
