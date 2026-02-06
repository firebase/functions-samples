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
// Upgrade database trigger to v2 to support params in path
const { onValueCreated } = require('firebase-functions/v2/database');
const { defineString, defineSecret, projectID } = require('firebase-functions/params');
const admin = require('firebase-admin');
admin.initializeApp();
const { OAuth2Client } = require('google-auth-library');
const { google } = require('googleapis');

const googleClientId = defineString('GOOGLE_CLIENT_ID', {
  label: 'Google Client ID',
  description: 'Google Client ID. Formerly functions.config().googleapi.client_id',
});
const googleClientSecret = defineSecret('GOOGLE_CLIENT_SECRET', {
  label: 'Google Client Secret',
  description: 'Google Client Secret. Formerly functions.config().googleapi.client_secret',
});
const googleSheetId = defineString('GOOGLE_SHEET_ID', {
  label: 'Google Sheet ID',
  description: 'Google Sheet ID. Formerly functions.config().googleapi.sheet_id',
});
const watchedDataPath = defineString('WATCHED_DATA_PATH', {
  label: 'Watched Data Path',
  description: 'Firebase path for data to be synced. Formerly functions.config().watchedpaths.data_path',
});

// The OAuth Callback Redirect.
let functionsRedirect;

// setup for authGoogleAPI
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
let functionsOauthClient;

functions.onInit(() => {
  functionsRedirect = `https://${projectID.value()}.firebaseapp.com/oauthcallback`;
  functionsOauthClient = new OAuth2Client(
    googleClientId.value(),
    googleClientSecret.value(),
    functionsRedirect
  );
});

// OAuth token cached locally.
let oauthTokens = null;

// visit the URL for this Function to request tokens
exports.authgoogleapi = functions.runWith({ secrets: [googleClientSecret] }).https.onRequest((req, res) => {
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
exports.oauthcallback = functions.runWith({ secrets: [googleClientSecret] }).https.onRequest(async (req, res) => {
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

// trigger function to write to Sheet when new data comes in on CONFIG_DATA_PATH
exports.appendrecordtospreadsheet = functions.database.ref(`${CONFIG_DATA_PATH}/{ITEM}`).onCreate(
  (snap) => {
    const newRecord = snap.val();
    return appendPromise({
      spreadsheetId: CONFIG_SHEET_ID,
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
  if (oauthTokens) {
    return functionsOauthClient;
  }
  const snapshot = await admin.database().ref(DB_TOKEN_PATH).once('value');
  oauthTokens = snapshot.val();
  functionsOauthClient.setCredentials(oauthTokens);
  return functionsOauthClient;
}

// HTTPS function to write new data to CONFIG_DATA_PATH, for testing
exports.testsheetwrite = functions.https.onRequest(async (req, res) => {
  const random1 = Math.floor(Math.random() * 100);
  const random2 = Math.floor(Math.random() * 100);
  const random3 = Math.floor(Math.random() * 100);
  const ID = new Date().getUTCMilliseconds();
  // Note: We use the param value directly for the path here.
  // In a real app, you might validate this path structure.
  // Since we don't have {ITEM} wildcard here, we just append to the path.
  // Wait, CONFIG_DATA_PATH was just the base path.
  // Note: We use the param value directly for the path here.
  // In a real app, you might validate this path structure.
  // Since we don't have {ITEM} wildcard here, we just append to the path.
  await admin.database().ref(`${watchedDataPath.value()}/${ID}`).set({
    firstColumn: random1,
    secondColumn: random2,
    thirdColumn: random3,
  });
  res.send(`Wrote ${random1}, ${random2}, ${random3} to DB, trigger should now update Sheet.`);
});
