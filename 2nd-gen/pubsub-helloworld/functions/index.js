/**
 * Copyright 2022 Google Inc. All Rights Reserved.
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
"use strict";

// [START import]
const {onMessagePublished} = require("firebase-functions/v2/pubsub");
const logger = require("firebase-functions/logger");
// [END import]

// [START helloWorld]
/**
 * Cloud Function to be triggered by Pub/Sub that logs a message using the
 *  data published to the topic.
 */
// [START trigger]
exports.hellopubsub = onMessagePublished("topic-name", (event) => {
  // [END trigger]
  // [START readBase64]
  // Decode the PubSub Message body.
  const message = event.data.message;
  const messageBody = message.data ?
        Buffer.from(message.data, "base64").toString() :
        null;
    // [END readBase64]
    // Print the message in the logs.
  logger.log(`Hello ${messageBody || "World"}!`);
  return null;
});
// [END helloWorld]


/**
 * Cloud Function to be triggered by Pub/Sub that logs a message using the
 *  data published to the topic as JSON.
 */
exports.hellopubsubjson = onMessagePublished("another-topic-name", (event) => {
  // [START readJson]
  // Get the `name` attribute of the PubSub message JSON body.
  let name = null;
  try {
    name = event.data.message.json.name;
  } catch (e) {
    logger.error("PubSub message was not JSON", e);
  }
  // [END readJson]
  // Print the message in the logs.
  logger.log(`Hello ${name || "World"}!`);
  return null;
});

/**
 * Cloud Function to be triggered by Pub/Sub that logs a message using the
 *  data attributes published to the topic.
 */
exports.hellopubsubattributes = onMessagePublished("yet-another-topic-name",
    (event) => {
      // [START readAttributes]
      // Get the `name` attribute of the message.
      const name = event.data.message.attributes.name;
      // [END readAttributes]
      // Print the message in the logs.
      logger.log(`Hello ${name || "World"}!`);
      return null;
    });
