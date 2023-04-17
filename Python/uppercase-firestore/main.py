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
# The Cloud Functions for Firebase SDK to create Cloud Functions and set up triggers.
from firebase_functions import firestore_fn, https_fn

# The Firebase Admin SDK to access the Firebase Realtime Database.
from firebase_admin import initialize_app, firestore
import google.cloud.firestore

app = initialize_app()
# [END import]


# [START addMessage]
# Take the text parameter passed to this HTTP endpoint and insert it into the
# Realtime Database under the path /messages/{pushId}/original
# [START addMessageTrigger]
@https_fn.on_request()
def addmessage(req: https_fn.Request) -> https_fn.Response:
# [END addMessageTrigger]
    # Grab the text parameter.
    original = req.args.get("text")
    if original is None:
        return https_fn.Response("No text parameter provided", status=400)

    # [START adminSdkPush]
    firestore_client: google.cloud.firestore.Client = firestore.client()

    # Push the new message into Cloud Firestore using the Firebase Admin SDK.
    _, doc_ref = firestore_client.collection("messages").add(
        {"original": original})

    # Send back a message that we've successfully written the message
    return https_fn.Response(f"Message with ID {doc_ref.id} added.")
    # [END adminSdkPush]
# [END addMessage]


# [START makeUppercase]
# Listens for new documents to be added to /messages. If the document has an
# "original" field, creates an "uppercase" field containg the contents of
# "original" in upper case.
@firestore_fn.on_document_created(document="messages/{pushId}")
def makeuppercase(
        event: firestore_fn.Event[firestore_fn.DocumentSnapshot]) -> None:
    # Get the value of "original" if it exists.
    try:
        original = event.data.get("original")
    except KeyError:
        # No "original" field, so do nothing.
        return

    # Use the Admin SDK to set an "uppercase" sibling.
    print(f"Uppercasing {event.params['pushId']}: {original}")
    upper = original.upper()
    event.data.reference.update({"uppercase": upper})
# [END makeUppercase]


# [START makeUppercase2]
# Listens for new documents to be added to /messages. If the document has an
# "original" field, creates an "uppercase" field containg the contents of
# "original" in upper case.
@firestore_fn.on_document_written(document="messages/{pushId}")
def makeuppercase2(
    event: firestore_fn.Event[
        firestore_fn.Change[firestore_fn.DocumentSnapshot | None]]
) -> None:
    # Only edit data when it is first created.
    if event.data.before is not None:
        return

    # Exit when the data is deleted.
    if event.data.after is None:
        return

    # Get the value of "original" if it exists.
    try:
        original = event.data.after.get("original")
    except KeyError:
        # No "original" field, so do nothing.
        return

    # Use the Admin SDK to set an "uppercase" sibling.
    print(f"Uppercasing {event.params['pushId']}: {original}")
    upper = original.upper()
    event.data.after.reference.update({"uppercase": upper})
# [END makeUppercase2]
# [END all]
