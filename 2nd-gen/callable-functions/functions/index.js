/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {getDatabase} = require("firebase-admin/database");
const {logger} = require("firebase-functions/v2");
const sanitizer = require("./sanitizer");

// [START allAdd]
// [START addFunctionTrigger]
// Adds two numbers to each other.
exports.addnumbers = onCall((data) => {
  // [END addFunctionTrigger]
  // [START readAddData]
  // Numbers passed from the client.
  const firstNumber = data.firstNumber;
  const secondNumber = data.secondNumber;
  // [END readAddData]


  // [START addHttpsError]
  // Checking that attributes are present and are numbers.
  if (!Number.isFinite(firstNumber) || !Number.isFinite(secondNumber)) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new HttpsError("invalid-argument", "The function must be called " +
            "with two arguments \"firstNumber\" and \"secondNumber\" which " +
            "must both be numbers.");
  }
  // [END addHttpsError]

  // [START returnAddData]
  // returning result.
  return {
    firstNumber: firstNumber,
    secondNumber: secondNumber,
    operator: "+",
    operationResult: firstNumber + secondNumber,
  };
  // [END returnAddData]
});
// [END allAdd]

// [START messageFunctionTrigger]
// Saves a message to the Firebase Realtime Database but sanitizes the
// text by removing swearwords.
exports.addmessage = onCall((data, context) => {
  // [START_EXCLUDE]
  // [START readMessageData]
  // Message text passed from the client.
  const text = data.text;
  // [END readMessageData]
  // [START messageHttpsErrors]
  // Checking attribute.
  if (!(typeof text === "string") || text.length === 0) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new HttpsError("invalid-argument", "The function must be called " +
            "with one arguments \"text\" containing the message text to add.");
  }
  // Checking that the user is authenticated.
  if (!context.auth) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new HttpsError("failed-precondition", "The function must be " +
            "called while authenticated.");
  }
  // [END messageHttpsErrors]

  // [START authIntegration]
  // Authentication / user information is automatically added to the request.
  const uid = context.auth.uid;
  const name = context.auth.token.name || null;
  const picture = context.auth.token.picture || null;
  const email = context.auth.token.email || null;
  // [END authIntegration]

  // [START returnMessageAsync]
  // Saving the new message to the Realtime Database.
  const sanitizedMessage = sanitizer.sanitizeText(text); // Sanitize message.

  return getDatabase.ref("/messages").push({
    text: sanitizedMessage,
    author: {uid, name, picture, email},
  }).then(() => {
    logger.info("New Message written");
    // Returning the sanitized message to the client.
    return {text: sanitizedMessage};
  })
  // [END returnMessageAsync]
      .catch((error) => {
        // Re-throwing the error as an HttpsError so that the client gets
        // the error details.
        throw new HttpsError("unknown", error.message, error);
      });
  // [END_EXCLUDE]
});
// [END messageFunctionTrigger]
