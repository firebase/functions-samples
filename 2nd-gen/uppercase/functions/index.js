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
'use strict';

// [START all]
// [START import]
// The Cloud Functions for Firebase SDK to create v2 Cloud Functions and setup triggers.
const { onRequest } = require('firebase-functions/v2/https');
const { onValueCreated } = require('firebase-functions/v2/database');
const { logger } = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();
// [END import]

// [START addmessage]
// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /messages/:pushId/original
// [START addMessageTrigger]
exports.addmessage = onRequest(async (req, resp) => {
// [END addMessageTrigger]
  // Grab the text parameter.
  const original = req.query.text;
  // [START adminSdkPush]
  // Push the new message into the Realtime Database using the Firebase Admin SDK.
  const snapshot = await admin.database().ref('/messages').push({original: original});
  // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
  res.redirect(303, snapshot.ref.toString());
  // [END adminSdkPush]
});
// [END addmessage]

// [START makeuppercase]
// Listens for new messages added to /messages/:pushId/original and creates an
// uppercase version of the message to /messages/:pushId/uppercase
// for all databases in 'us-central1'
exports.makeuppercase = onValueCreated('/messages/{pushId}/original', (event) => {
      // Grab the current value of what was written to the Realtime Database.
      const original = event.data.val();
      logger.log('Uppercasing', event.params.pushId, original);
      const uppercase = original.toUpperCase();
      // You must return a Promise when performing asynchronous tasks inside a function, such as
      // writing to the Firebase Realtime Database.
      // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
      return event.data.ref.parent.child('uppercase').set(uppercase);
    });
// [END makeuppercase]
// [END all]
