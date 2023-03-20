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
from urllib import parse as urllib_parse

# [START import]
# The Cloud Functions for Firebase SDK to create Cloud Functions and set up triggers.
from firebase_functions import db_fn, https_fn

# The Firebase Admin SDK to access the Firebase Realtime Database.
from firebase_admin import initialize_app, db

app = initialize_app()
# [END import]


# [START addMessage]
# Take the text parameter passed to this HTTP endpoint and insert it into the
# Realtime Database under the path /messages/:pushId/original
# [START addMessageTrigger]
@https_fn.on_request()
def addmessage(req: https_fn.Request) -> https_fn.Response:
# [END addMessageTrigger]
    # Grab the text parameter.
    original = req.args.get("text")
    if original is None:
        return https_fn.Response("No text parameter provided", status=400)
    # [START adminSdkPush]

    # Push the new message into the Realtime Database using the Firebase Admin SDK.
    ref = db.reference("/messages").push({"original": original})

    # Redirect with 303 SEE OTHER to the URL of the pushed object.
    scheme, location, path, query, fragment = urllib_parse.urlsplit(
        app.options.get("databaseURL"))
    path = f"{ref.path}.json"
    return https_fn.Response(
        status=303,
        headers={
            "Location":
                urllib_parse.urlunsplit(
                    (scheme, location, path, query, fragment))
        },
    )
    # [END adminSdkPush]
# [END addMessage]


# [START makeUppercase]
# Listens for new messages added to /messages/{pushId}/original and creates an
# uppercase version of the message to /messages/{pushId}/uppercase
@db_fn.on_value_created(reference="/messages/{pushId}/original")
def makeuppercase(event: db_fn.Event[object]) -> None:
    # Grab the value that was written to the Realtime Database.
    original = event.data
    if not hasattr(original, "upper"):
        print(f"Not a string: {event.reference}")
        return

    # Use the Admin SDK to set an "uppercase" sibling.
    print(f"Uppercasing {event.reference}: {original}")
    upper = original.upper()
    db.reference(event.reference).parent.child("uppercase").set(upper)
# [END makeUppercase]
# [END all]
