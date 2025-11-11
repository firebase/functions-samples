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

const functions = require('firebase-functions/v1');
const {defineString, defineSecret} = require('firebase-functions/params');
const admin = require('firebase-admin');
admin.initializeApp();
const {OAuth2Client} = require('google-auth-library');
const {google} = require('googleapis');

// TODO: Configure the `GOOGLEAPI_CLIENT_ID` and `GOOGLEAPI_CLIENT_SECRET` secrets,
// and the `GOOGLEAPI_SHEET_ID` environment variable.
const GOOGLEAPI_CLIENT_ID = defineSecret('GOOGLEAPI_CLIENT_ID');
const GOOGLEAPI_CLIENT_SECRET = defineSecret('GOOGLEAPI_CLIENT_SECRET');
const GOOGLEAPI_SHEET_ID = defineString('GOOGLEAPI_SHEET_ID');

// TODO: Configure the `WATCHEDPATHS_DATA_PATH` environment variable.
const WATCHEDPATHS_DATA_PATH = defineString('WATCHEDPATHS_DATA_PATH');

// The OAuth Callback Redirect.
const FUNCTIONS_REDIRECT = `https://${process.env.GCLOUD_PROJECT}.firebaseapp.com/oauthcallback`;

// setup for authGoogleAPI
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// OAuth token cached locally.
let oauthTokens = null;

// visit the URL for this Function to request tokens
exports.authgoogleapi = functions.runWith({secrets: ["GOOGLEAPI_CLIENT_ID", "GOOGLEAPI_CLIENT_SECRET"]}).https.onRequest((req, res) => {
  const functionsOauthClient = new OAuth2Client(GOOGLEAPI_CLIENT_ID.value(), GOOGLEAPI_CLIENT_SECRET.value(),
    FUNCTIONS_REDIRECT);
  res.set('Cache-Control', 'private, max-age=0, s-maxage=0');
  res.redirect(functionsOauthClient.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  }));
});

// setup for OauthCallback
const DB_TOKEN_PATH = '/api_tokens';

// after you grant access, you will be redirected to the URL for this Function
// this Function stores the tokens to your Firebase database
exports.oauthcallback = functions.runWith({secrets: ["GOOGLEAPI_CLIENT_ID", "GOOGLEAPI_CLIENT_SECRET"]}).https.onRequest(async (req, res) => {
  const functionsOauthClient = new OAuth2Client(GOOGLEAPI_CLIENT_ID.value(), GOOGLEAPI_CLIENT_SECRET.value(),
    FUNCTIONS_REDIRECT);
  res.set('Cache-Control', 'private, max-age=0, s-maxage=0');
  const code = `${req.query.code}`;
  try {
    const { tokens } = await functionsOauthClient.getToken(code);
    // Now tokens contains an access_token and an optional refresh_token. Save them.
    await admin.database().ref(DB_TOKEN_PATH).set(tokens);
    res.status(200).send('App successfully configured with new Credentials. '
        + 'You can now close this page.');
  } catch (error) {
    res.status(400).send(error);
  }
});

// trigger function to write to Sheet when new data comes in on WATCHEDPATHS_DATA_PATH
exports.appendrecordtospreadsheet = functions.runWith({secrets: ["GOOGLEAPI_CLIENT_ID", "GOOGLEAPI_CLIENT_SECRET"]}).database.ref('/{ITEM}').onCreate(
    (snap, context) => {
      if (context.resource.name.split('/')[1] !== WATCHEDPATHS_DATA_PATH.value()) {
        return null;
      }
      const newRecord = snap.val();
      return appendPromise({
        spreadsheetId: GOOGLEAPI_SHEET_ID.value(),
        range: 'A:C',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [[newRecord.firstColumn, newRecord.secondColumn, newRecord.thirdColumn]],
        },
      });
    });

// accepts an append request, returns a Promise to append it, enriching it with auth
function appendPromise(requestWithoutAuth) {
  return new Promise((resolve, reject) => {
    return getAuthorizedClient().then((client) => {
      const sheets = google.sheets('v4');
      const request = requestWithoutAuth;
      request.auth = client;
      return sheets.spreadsheets.values.append(request, (err, response) => {
        if (err) {
          functions.logger.log(`The API returned an error: ${err}`);
          return reject(err);
        }
        return resolve(response.data);
      });
    });
  });
}

// checks if oauthTokens have been loaded into memory, and if not, retrieves them
async function getAuthorizedClient() {
  const functionsOauthClient = new OAuth2Client(GOOGLEAPI_CLIENT_ID.value(), GOOGLEAPI_CLIENT_SECRET.value(),
    FUNCTIONS_REDIRECT);
  if (oauthTokens) {
    functionsOauthClient.setCredentials(oauthTokens);
    return functionsOauthClient;
  }
  const snapshot = await admin.database().ref(DB_TOKEN_PATH).once('value');
  oauthTokens = snapshot.val();
  functionsOauthClient.setCredentials(oauthTokens);
  return functionsOauthClient;
}

// HTTPS function to write new data to WATCHEDPATHS_DATA_PATH, for testing
exports.testsheetwrite = functions.https.onRequest(async (req, res) => {
  const random1 = Math.floor(Math.random() * 100);
  const random2 = Math.floor(Math.random() * 100);
  const random3 = Math.floor(Math.random() * 100);
  const ID = new Date().getUTCMilliseconds();
  await admin.database().ref(`${WATCHEDPATHS_DATA_PATH.value()}/${ID}`).set({
    firstColumn: random1,
    secondColumn: random2,
    thirdColumn: random3,
  });
  res.send(`Wrote ${random1}, ${random2}, ${random3} to DB, trigger should now update Sheet.`);
});
