# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https:#www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import re
from typing import Any

from firebase_admin import db, initialize_app
from firebase_functions import https_fn, options

initialize_app()

# [START v2allAdd]
# [START v2addFunctionTrigger]
# Adds two numbers to each other.
@https_fn.on_call()
def addnumbers(req: https_fn.CallableRequest) -> Any:
# [END v2addFunctionTrigger]
    # [START v2addHttpsError]
    # Checking that attributes are present and are numbers.
    try:
        # [START v2readAddData]
        # Numbers passed from the client.
        first_number_param = req.data["firstNumber"]
        second_number_param = req.data["secondNumber"]
        # [END v2readAddData]
        first_number = int(first_number_param)
        second_number = int(second_number_param)
    except (ValueError, KeyError):
        # Throwing an HttpsError so that the client gets the error details.
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message=(
                'The function must be called with two arguments, "firstNumber"'
                ' and "secondNumber", which must both be numbers.'
            ),
        )
    # [END v2addHttpsError]

    # [START v2returnAddData]
    return {
        "firstNumber": first_number,
        "secondNumber": second_number,
        "operator": "+",
        "operationResult": first_number + second_number,
    }
    # [END v2returnAddData]
# [END v2allAdd]

# Saves a message to the Firebase Realtime Database but sanitizes the
# text by removing swearwords.
# [START v2messageFunctionTrigger]
@https_fn.on_call()
def addmessage(req: https_fn.CallableRequest) -> Any:
# [END v2messageFunctionTrigger]
    try:
        # [START v2readMessageData]
        # Message text passed from the client.
        text = req.data["text"]
        # [END v2readMessageData]
    except KeyError:
        # Throwing an HttpsError so that the client gets the error details.
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message=('The function must be called with one argument, "text",'
                     ' containing the message text to add.'),
        )

    # [START v2messageHttpsErrors]
    # Checking attribute.
    if not isinstance(text, str) or len(text) < 1:
        # Throwing an HttpsError so that the client gets the error details.
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message=('The function must be called with one argument, "text",'
                     ' containing the message text to add.'),
        )

    # Checking that the user is authenticated.
    if req.auth is None:
        # Throwing an HttpsError so that the client gets the error details.
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.FAILED_PRECONDITION,
            message="The function must be called while authenticated.",
        )
    # [END v2messageHttpsErrors]

    # [START v2authIntegration]
    # Authentication / user information is automatically added to the request.
    uid = req.auth.uid
    name = req.auth.token.get("name", "")
    picture = req.auth.token.get("picture", "")
    email = req.auth.token.get("email", "")
    # [END v2authIntegration]

    try:
        # [START v2returnMessage]
        # Saving the new message to the Realtime Database.
        sanitized_message = sanitize_text(text)  # Sanitize message.
        db.reference("/messages").push(
            {
                "text": sanitized_message,
                "author": {
                    "uid": uid,
                    "name": name,
                    "picture": picture,
                    "email": email,
                },
            }
        )
        print("New message written")

        # Returning the sanitized message to the client.
        return {"text": sanitized_message}
        # [END v2returnMessage]
    except Exception as e:
        # Re-throwing the error as an HttpsError so that the client gets
        # the error details.
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNKNOWN, message=e, details=e
        )


def sanitize_text(text: str) -> str:
    # Use indoor voice
    if text.isupper():
        text = text.capitalize()

    # Censor bad words
    swears = re.compile(r"shoot|dang|heck", re.IGNORECASE)
    text = swears.sub(repl=lambda m: "*" * (m.end() - m.start()), string=text)

    return text
