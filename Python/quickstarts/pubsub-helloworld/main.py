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


import base64

# [START import]
from firebase_functions import pubsub_fn
# [END import]


# [START helloWorld]
# Cloud Function to be triggered by Pub/Sub that logs a message using the data published to the
# topic.
# [START trigger]
@pubsub_fn.on_message_published(topic="topic-name")
def hellopubsub(event: pubsub_fn.CloudEvent[pubsub_fn.MessagePublishedData]) -> None:
# [END trigger]
    # [START readBase64]
    # Decode the PubSub message body.
    message_body = base64.b64decode(event.data.message.data)
    # [END readBase64]

    # Print the message.
    print(f"Hello, {message_body.decode('utf-8') if message_body else 'World'}")
# [END helloWorld]


# Cloud Function to be triggered by Pub/Sub that logs a message using the data published to the
# topic as JSON.
@pubsub_fn.on_message_published(topic="another-topic-name")
def hellopubsubjson(
    event: pubsub_fn.CloudEvent[pubsub_fn.MessagePublishedData],
) -> None:
    # [START readJson]
    # Get the `name` attribute of the PubSub message JSON body.
    try:
        data = event.data.message.json
    except ValueError:
        print("PubSub message was not JSON")
        return
    # [END readJson]

    if "name" not in data:
        print("No 'name' key")
        return
    # Print the message in the logs.
    print(f"Hello, {data['name']}")


# Cloud Function to be triggered by Pub/Sub that logs a message using the data attributes
# published to the topic.
@pubsub_fn.on_message_published(topic="yet-another-topic-name")
def hellopubsubattributes(
    event: pubsub_fn.CloudEvent[pubsub_fn.MessagePublishedData],
) -> None:
    # [START readAttributes]
    # Get the `name` attribute of the message.
    if "name" not in event.data.message.attributes:
        print("No 'name' attribute")
        return
    name = event.data.message.attributes["name"]
    # [END readAttributes]

    # Print the message in the logs.
    print(f"Hello, {name}")
