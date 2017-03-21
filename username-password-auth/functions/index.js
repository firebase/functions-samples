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
 * See the License for t`he specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const functions = require('firebase-functions');

// CORS Express middleware to enable CORS Requests.
const cors = require('cors')({origin: true});

// Firebase Setup
const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${process.env.GCLOUD_PROJECT}.firebaseio.com`
});

// Use Request to make the basic authentication request.
const authRequest = require('request');

/**
 * Authenticate the provided credentials returning a Firebase custom auth token.
 * If authentication fails return a 401 response.
 * If an error occurs log the details and return a 500 response.
 */
exports.auth = functions.https.onRequest((req, res) => {
  try {
      cors(req, res, () => {
        // Handle CORS preflight request
        if (req.method === 'OPTIONS') {
          return res.sendStatus(200);
        }
        // Authentication requests are POSTed, other requests are forbidden
        if (req.method !== 'POST') {
          return res.sendStatus(403);
        }
        let username = req.body.username;
        if (!username) {
          return res.sendStatus(400);
        }
        let password = req.body.password;
        if (!password) {
          return res.sendStatus(400);
        }
        // For the purpose of this example use httpbin (https://httpbin.org) for the basic authentication request.
        // (Only a password of `Testing123` will succeed)
        let url = "https://httpbin.org/basic-auth/" + username + "/Testing123";
        let creds = {
          'auth': {
              'user': username,
              'pass': password
          }
        }
        authRequest(url, creds, function (error, response, body) {
          let statusCode = response ? response.statusCode : 0;
          if (statusCode === 401) { // Invalid username/password
              return res.sendStatus(401);
          }
          if (statusCode !== 200) {
              console.log('ERROR: invalid response returned from ', url, ' status code ', statusCode);
              return res.sendStatus(500);
          }
          // On success create/update the Firebase account and return the Custom Auth Token.
          // - any extra user details can also be created/updated here
          createFirebaseAccount(username).then(firebaseToken => {
                return res.status(200).json({token: firebaseToken});
          });
        });
      });
  } catch (error) {
    console.log('ERROR:', error);
    return res.sendStatus(500);
  }
});

/**
 * Creates a Firebase account with the given user id and returns a custom auth token allowing
 * signing-in this account.
 *
 * @returns {Promise<string>} The Firebase custom auth token in a promise.
 */
function createFirebaseAccount(uid) {
  // Create or update the user account.
  const userCreationTask = admin.auth().updateUser(uid, {}).catch(error => {
    // If user does not exists we create it.
    if (error.code === 'auth/user-not-found') {
      return admin.auth().createUser({uid: uid });
    }
    throw error;
  });
  // Wait for all async task to complete then generate and return a custom auth token.
  return Promise.all([userCreationTask]).then(() => {
    // Create a Firebase custom auth token.
    const token = admin.auth().createCustomToken(uid);
    console.log('Created Custom token for UID "', uid, '" Token:', token);
    return token;
  });
}
