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
from typing import Any
from urllib import parse as urllib_parse

# [START import]
# The Cloud Functions for Firebase SDK to create Cloud Functions and set up triggers.
from firebase_functions import db_fn, https_fn

# The Firebase Admin SDK to access the Firebase Realtime Database.
from firebase_admin import initialize_app, db

app = initialize_app()
# [END import]


# [START addMessage]
# [START addMessageTrigger]
@https_fn.on_request()
def addmessage(req: https_fn.Request) -> https_fn.Response:
    """Take the text parameter passed to this HTTP endpoint and insert it into
    the Realtime Database under the path /messages/{pushId}/original"""
# [END addMessageTrigger]
    # Grab the text parameter.
    original = req.args.get("text")
    if original is None:
        return https_fn.Response("No text parameter provided", status=400)
    # [START adminSdkPush]
    # Push the new message into the Realtime Database using the Firebase Admin SDK.
    ref = db.reference("/messages").push({"original": original})  # type: ignore

    # Redirect with 303 SEE OTHER to the URL of the pushed object.
    scheme, location, path, query, fragment = (
        b.decode() for b in urllib_parse.urlsplit(app.options.get("databaseURL")))
    path = f"{ref.path}.json"
    return https_fn.Response(
        status=303,
        headers={"Location": urllib_parse.urlunsplit((scheme, location, path, query, fragment))})
    # [END adminSdkPush]
# [END addMessage]


# [START makeUppercase]
@db_fn.on_value_created(reference="/messages/{pushId}/original")
def makeuppercase(event: db_fn.Event[Any]) -> None:
    """Listens for new messages added to /messages/{pushId}/original and
    creates an uppercase version of the message to /messages/{pushId}/uppercase
    """

    # Grab the value that was written to the Realtime Database.
    original = event.data
    if not isinstance(original, str):
        print(f"Not a string: {event.reference}")
        return

    # Use the Admin SDK to set an "uppercase" sibling.
    print(f"Uppercasing {event.params['pushId']}: {original}")
    upper = original.upper()
    parent = db.reference(event.reference).parent
    if parent is None:
        print("Message can't be root node.")
        return
    parent.child("uppercase").set(upper)
# [END makeUppercase]


# [START makeUppercase2]
@db_fn.on_value_written(reference="/messages/{pushId}/original")
def makeuppercase2(event: db_fn.Event[db_fn.Change]) -> None:
    """Listens for new messages added to /messages/{pushId}/original and
    creates an uppercase version of the message to /messages/{pushId}/uppercase
    """

    # Only edit data when it is first created.
    if event.data.before is not None:
        return

    # Exit when the data is deleted.
    if event.data.after is None:
        return

    # Grab the value that was written to the Realtime Database.
    original = event.data.after
    if not hasattr(original, "upper"):
        print(f"Not a string: {event.reference}")
        return

    # Use the Admin SDK to set an "uppercase" sibling.
    print(f"Uppercasing {event.params['pushId']}: {original}")
    upper = original.upper()
    parent = db.reference(event.reference).parent
    if parent is None:
        print("Message can't be root node.")
        return
    parent.child("uppercase").set(upper)
# [END makeUppercase2]
# [END all]
