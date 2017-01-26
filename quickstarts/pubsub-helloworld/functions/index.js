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
 * Cloud Function to be triggered by Pub/Sub.
 *
 * @param {object} event The Cloud Functions event.
 */
// [START trigger]
exports.helloPubSub = functions.pubsub('topic-name').onPublish(event => {
// [END trigger]
  const pubsubMessage = event.data;
  // Read the PubSub Message as a String.
  const name = pubsubMessage.data ? Buffer.from(pubsubMessage.data, 'base64').toString() : null;
  // Print the message in the logs.
  console.log(`Hello ${name || 'World'}!`);
});
// [END helloWorld]
