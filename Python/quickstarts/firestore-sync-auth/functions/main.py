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
from firebase_functions import firestore_fn


# [START verifyComment]
@firestore_fn.on_document_updated_with_auth_context(document="comments/{comment_id}")
def verify_comment(event: Event[Change[DocumentSnapshot]]) -> None:

    # Get the current and previous document values.
    new_value = event.data.after
    prev_value = event.data.before

    # Get the auth context from the event
    user_auth_type = event.auth_type
    user_auth_id = event.auth_id

    verified = False
    if user_auth_type == "system":
        # system-generated users are automatically verified
        verified = True
    elif user_auth_type in ("unknown", "unauthenticated"):
        if user_auth_id.endswith("@example.com"):
            # admin users from a specific domain are verified
            verified = True

    # add auth medadata to the document
    new_value.reference.update({"created_by": user_auth_id, "verified": verified})


# [END verifyComment]
# [END all]
