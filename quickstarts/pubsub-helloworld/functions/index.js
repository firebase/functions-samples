/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

// [START import]
const functions = require('firebase-functions');
// [END import]

// [START helloWorld]
/**
 * Cloud Function to be triggered by Pub/Sub that logs a message using the data published to the
 * topic.
 */
// [START trigger]
exports.helloPubSub = functions.pubsub.topic('topic-name').onPublish((event) => {
// [END trigger]
  // [START readBase64]
  const pubSubMessage = event.data;
  // Decode the PubSub Message body.
  const messageBody = pubSubMessage.data ? Buffer.from(pubSubMessage.data, 'base64').toString() : null;
  // [END readBase64]
  // Print the message in the logs.
  console.log(`Hello ${messageBody || 'World'}!`);
});
// [END helloWorld]

/**
 * Cloud Function to be triggered by Pub/Sub that logs a message using the data published to the
 * topic as JSON.
 */
exports.helloPubSubJson = functions.pubsub.topic('another-topic-name').onPublish((event) => {
  // [START readJson]
  const pubSubMessage = event.data;
  // Get the `name` attribute of the PubSub message JSON body.
  let name = null;
  try {
    name = pubSubMessage.json.name;
  } catch (e) {
    console.error('PubSub message was not JSON', e);
  }
  // [END readJson]
  // Print the message in the logs.
  console.log(`Hello ${name || 'World'}!`);
});

/**
 * Cloud Function to be triggered by Pub/Sub that logs a message using the data attributes
 * published to the topic.
 */
exports.helloPubSubAttributes = functions.pubsub.topic('yet-another-topic-name').onPublish((event) => {
  // [START readAttributes]
  const pubSubMessage = event.data;
  // Get the `name` attribute of the message.
  const name = pubSubMessage.attributes.name;
  // [END readAttributes]
  // Print the message in the logs.
  console.log(`Hello ${name || 'World'}!`);
});
