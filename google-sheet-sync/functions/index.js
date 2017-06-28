// Trigger function copies new data in Firebase database to Google Sheet

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const googleAuth = require('google-auth-library');
const google = require('googleapis');

admin.initializeApp(functions.config().firebase);
const db = admin.database();

const FUNCTIONS_CLIENT_ID = functions.config().googleapi.client_id;
const FUNCTIONS_SECRET_KEY = functions.config().googleapi.client_secret;
const FUNCTIONS_REDIRECT = '{YOUR_FUNCTIONS_SUBDOMAIN}.cloudfunctions.net/OauthCallback';
// TODO: use firebase functions:config:set to configure your Google API client ID and secret
// TODO: update FUNCTIONS_REDIRECT

// data will be synced from DATA_PATH in Firebase to Google Sheet with SHEET_ID
const DATA_PATH = '/testing';
const SHEET_ID = '';
// TODO: add in sheet ID (long string in middle of Sheet URL)


// setup for authGoogleAPI
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const auth = new googleAuth();
const functionsOauthClient = new auth.OAuth2(FUNCTIONS_CLIENT_ID, FUNCTIONS_SECRET_KEY,
  FUNCTIONS_REDIRECT);
let oauthTokens = null;

// visit the URL for this Function to request tokens
exports.authGoogleAPI = functions.https.onRequest((req, res) =>
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
exports.OauthCallback = functions.https.onRequest((req, res) => {
  const code = req.query.code;
  functionsOauthClient.getToken(code, (err, tokens) => {
    // Now tokens contains an access_token and an optional refresh_token. Save them.
    if (err) {
      return res.status(400).send(err);
    }
    return db.ref(DB_TOKEN_PATH).set(tokens).then(() => res.status(200).send('OK'));
  });
});

// trigger function to write to Sheet when new data comes in on DATA_PATH
exports.appendRecordToSpreadsheet = functions.database.ref(`${DATA_PATH}/{ITEM}`).onWrite(
  (event) => {
    const newRecord = event.data.current.val();
    return appendPromise({
      spreadsheetId: SHEET_ID,
      range: 'A:C',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [[newRecord.firstColumn, newRecord.secondColumn, newRecord.thirdColumn]]
      }
    });
});

// accepts an append request, returns a Promise to append it, enriching it with auth
function appendPromise(requestWithoutAuth) {
  return new Promise((resolve, reject) => {
    getAuthorizedClient().then((client) => {
      const sheets = google.sheets('v4');
      const request = requestWithoutAuth;
      request.auth = client;
      sheets.spreadsheets.values.append(request, (err, response) => {
        if (err) {
          console.log(`The API returned an error: ${err}`);
          return reject();
        }
        return resolve(response);
      });
    }).catch(() => reject());
  });
}

// checks if oauthTokens have been loaded into memory, and if not, retrieves them
function getAuthorizedClient() {
  return new Promise((resolve, reject) => {
    if (oauthTokens) {
      return resolve(functionsOauthClient);
    }
    db.ref(DB_TOKEN_PATH).once('value').then((snapshot) => {
      oauthTokens = snapshot.val();
      functionsOauthClient.setCredentials(oauthTokens);
      return resolve(functionsOauthClient);
    }).catch(() => reject());
  });
}

// HTTPS function to write new data to DATA_PATH, for testing
exports.testSheetWrite = functions.https.onRequest((req, res) => {
  const random1 = Math.floor(Math.random() * 100);
  const random2 = Math.floor(Math.random() * 100);
  const random3 = Math.floor(Math.random() * 100);
  const ID = new Date().getUTCMilliseconds();
  return db.ref(`${DATA_PATH}/${ID}`).set({
    firstColumn: random1,
    secondColumn: random2,
    thirdColumn: random3
  }).then(() => res.status(200).send(
    `Wrote ${random1}, ${random2}, ${random3} to DB, trigger should now update Sheet.`));
});
