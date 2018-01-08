/**
* Copyright 2017 Google Inc. All Rights Reserved.
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

// Sample trigger function that copies new Firebase data to a Google Sheet

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const googleAuth = require('google-auth-library');
const google = require('googleapis');

admin.initializeApp(functions.config().firebase);
const db = admin.database();

// TODO: Use firebase functions:config:set to configure your googleapi object:
// googleapi.client_id = Google API client ID,
// googleapi.client_secret = client secret, and
// googleapi.sheet_id = Google Sheet id (long string in middle of sheet URL)
const CONFIG_CLIENT_ID = functions.config().googleapi.client_id;
const CONFIG_CLIENT_SECRET = functions.config().googleapi.client_secret;
const CONFIG_SHEET_ID = functions.config().googleapi.sheet_id;

// TODO: Use firebase functions:config:set to configure your watchedpaths object:
// watchedpaths.data_path = Firebase path for data to be synced to Google Sheet
const CONFIG_DATA_PATH = functions.config().watchedpaths.data_path;

// The OAuth Callback Redirect.
const FUNCTIONS_REDIRECT = `${process.env.GCLOUD_PROJECT}.firebaseapp.com/oauthcallback`;

// setup for authGoogleAPI
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const auth = new googleAuth();
const functionsOauthClient = new auth.OAuth2(CONFIG_CLIENT_ID, CONFIG_CLIENT_SECRET,
  FUNCTIONS_REDIRECT);

// OAuth token cached locally.
let oauthTokens = null;

// visit the URL for this Function to request tokens
exports.authgoogleapi = functions.https.onRequest((req, res) =>
  res.redirect(functionsOauthClient.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  }))
);

// setup for OauthCallback
const DB_TOKEN_PATH = '/api_tokens';

// after you grant access, you will be redirected to the URL for this Function
// this Function stores the tokens to your Firebase database
exports.oauthcallback = functions.https.onRequest((req, res) => {
  const code = req.query.code;
  functionsOauthClient.getToken(code, (err, tokens) => {
    // Now tokens contains an access_token and an optional refresh_token. Save them.
    if (err) {
      return res.status(400).send(err);
    }
    return db.ref(DB_TOKEN_PATH).set(tokens)
      .then(() => {
        return res.status(200).send('App successfully configured with new Credentials. '
          + 'You can now close this page.');
      });
  });
});

// trigger function to write to Sheet when new data comes in on CONFIG_DATA_PATH
exports.appendrecordtospreadsheet = functions.database.ref(`${CONFIG_DATA_PATH}/{ITEM}`).onWrite(
  event => {
    const newRecord = event.data.current.val();
    return appendPromise({
      spreadsheetId: CONFIG_SHEET_ID,
      range: 'A:C',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [[newRecord.firstColumn, newRecord.secondColumn, newRecord.thirdColumn]]
      }
    });
  }
);

// accepts an append request, returns a Promise to append it, enriching it with auth
function appendPromise(requestWithoutAuth) {
  return new Promise((resolve, reject) => {
    return getAuthorizedClient().then(client => {
      const sheets = google.sheets('v4');
      const request = requestWithoutAuth;
      request.auth = client;
      return sheets.spreadsheets.values.append(request, (err, response) => {
        if (err) {
          console.log(`The API returned an error: ${err}`);
          return reject(err);
        }
        return resolve(response);
      });
    });
  });
}

// checks if oauthTokens have been loaded into memory, and if not, retrieves them
function getAuthorizedClient() {
  if (oauthTokens) {
    return Promise.success(functionsOauthClient);
  }
  return db.ref(DB_TOKEN_PATH).once('value').then(snapshot => {
    oauthTokens = snapshot.val();
    functionsOauthClient.setCredentials(oauthTokens);
    return functionsOauthClient;
  })
}

// HTTPS function to write new data to CONFIG_DATA_PATH, for testing
exports.testsheetwrite = functions.https.onRequest((req, res) => {
  const random1 = Math.floor(Math.random() * 100);
  const random2 = Math.floor(Math.random() * 100);
  const random3 = Math.floor(Math.random() * 100);
  const ID = new Date().getUTCMilliseconds();
  return db.ref(`${CONFIG_DATA_PATH}/${ID}`).set({
    firstColumn: random1,
    secondColumn: random2,
    thirdColumn: random3
  }).then(() => res.status(200).send(
    `Wrote ${random1}, ${random2}, ${random3} to DB, trigger should now update Sheet.`));
});
