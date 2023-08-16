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

// [START imports]
// Dependencies for callable functions.
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {logger} = require("firebase-functions/v2");

// Dependencies for the addMessage function.
const {getDatabase} = require("firebase-admin/database");
const sanitizer = require("./sanitizer");
// [END imports]

// [START v2allAdd]
// [START v2addFunctionTrigger]
// Adds two numbers to each other.
exports.addnumbers = onCall((request) => {
  // [END v2addFunctionTrigger]
  // [START v2readAddData]
  // Numbers passed from the client.
  const firstNumber = request.data.firstNumber;
  const secondNumber = request.data.secondNumber;
  // [END v2readAddData]

  // [START v2addHttpsError]
  // Checking that attributes are present and are numbers.
  if (!Number.isFinite(firstNumber) || !Number.isFinite(secondNumber)) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new HttpsError("invalid-argument", "The function must be called " +
            "with two arguments \"firstNumber\" and \"secondNumber\" which " +
            "must both be numbers.");
  }
  // [END v2addHttpsError]

  // [START v2returnAddData]
  // returning result.
  return {
    firstNumber: firstNumber,
    secondNumber: secondNumber,
    operator: "+",
    operationResult: firstNumber + secondNumber,
  };
  // [END v2returnAddData]
});
// [END v2allAdd]

// [START v2messageFunctionTrigger]
// Saves a message to the Firebase Realtime Database but sanitizes the
// text by removing swearwords.
exports.addmessage = onCall((request) => {
  // [START_EXCLUDE]
  // [START v2readMessageData]
  // Message text passed from the client.
  const text = request.data.text;
  // [END v2readMessageData]
  // [START v2messageHttpsErrors]
  // Checking attribute.
  if (!(typeof text === "string") || text.length === 0) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new HttpsError("invalid-argument", "The function must be called " +
            "with one arguments \"text\" containing the message text to add.");
  }
  // Checking that the user is authenticated.
  if (!request.auth) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new HttpsError("failed-precondition", "The function must be " +
            "called while authenticated.");
  }
  // [END v2messageHttpsErrors]

  // [START v2authIntegration]
  // Authentication / user information is automatically added to the request.
  const uid = request.auth.uid;
  const name = request.auth.token.name || null;
  const picture = request.auth.token.picture || null;
  const email = request.auth.token.email || null;
  // [END v2authIntegration]

  // [START v2returnMessageAsync]
  // Saving the new message to the Realtime Database.
  const sanitizedMessage = sanitizer.sanitizeText(text); // Sanitize message.

  return getDatabase().ref("/messages").push({
    text: sanitizedMessage,
    author: {uid, name, picture, email},
  }).then(() => {
    logger.info("New Message written");
    // Returning the sanitized message to the client.
    return {text: sanitizedMessage};
  })
  // [END v2returnMessageAsync]
      .catch((error) => {
        // Re-throwing the error as an HttpsError so that the client gets
        // the error details.
        throw new HttpsError("unknown", error.message, error);
      });
  // [END_EXCLUDE]
});
// [END v2messageFunctionTrigger]
