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

const dialogflow = require('dialogflow');
const uuid = require('uuid');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const projectId = "YOUR_PROJECT_ID_HERE";

// a sample function that sends the text written at the set reference to the dialogflow API and writes the response as
// another message in that same conversation
exports.sample_dialog = functions.database.ref('/conversations/{convID}/messages/{mID}').onWrite(
  async (change, context) => {
    const snapshot = change.after;
    const val = snapshot.val();

    if(val.sender == "bot")
    return;
    const textString = val.text;

    const sessionId = uuid.v4();

    // Create a new session
    const sessionClient = new dialogflow.SessionsClient();
    const sessionPath = sessionClient.sessionPath(projectId, sessionId);

    // The text query request.
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          // The query to send to the dialogflow agent
          text: textString,
          // The language used by the client (en-US)
          languageCode: 'en-US',
        },
      },
    };

    // Send request and log result
    const responses = await sessionClient.detectIntent(request);
    console.log('Detected intent');

    const result = responses[0].queryResult;

    console.log(`  Query: ${result.queryText}`);

    console.log(`  Response: ${result.fulfillmentText}`);

    // Write the response in the same conversation with another message ID.
    return admin.database().ref(`/conversations/${context.params.convID}/messages/mes` + Math.round(100000000000 * Math.random())).set({
        text: result.fulfillmentText,
        sender: "bot"
    });

  });
