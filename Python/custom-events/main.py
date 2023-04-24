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

# [START import]
from firebase_admin import firestore, initialize_app
from firebase_functions import eventarc_fn
# [END import]
import google.cloud.firestore


initialize_app()


# [START imageresizedEvent]
@eventarc_fn.on_custom_event_published(
    event_type="firebase.extensions.storage-resize-images.v1.complete")
def onimageresized(event: eventarc_fn.CloudEvent) -> None:
    print("Received image resize completed event: ", event.type)

    # For example, write resized image details into Firestore.
    firestore_client: google.cloud.firestore.Client = firestore.client()
    collection = firestore_client.collection("images")
    doc = collection.document(event.subject.replace("/", "_"))  # original file path
    doc.set(event.data)  # resized images paths and sizes
# [END imageresizedEvent]



# [START nondefaultchannel]
@eventarc_fn.on_custom_event_published(
    event_type="firebase.extensions.storage-resize-images.v1.complete",
    channel="locations/us-west1/channels/firebase",
    region="us-west1")
def onimageresizedwest(event: eventarc_fn.CloudEvent) -> None:
    print("Received image resize completed event: ", event.type)

    # For example, write resized image details into Firestore.
    firestore_client: google.cloud.firestore.Client = firestore.client()
    collection = firestore_client.collection("images")
    doc = collection.document(event.subject.replace("/", "_"))  # original file path
    doc.set(event.data)  # resized images paths and sizes
# [END nondefaultchannel]
