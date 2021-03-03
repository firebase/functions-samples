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
 * See the License for t`he specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const functions = require('firebase-functions');

// CORS Express middleware to enable CORS Requests.
const cors = require('cors')({origin: true});

// Firebase Setup
const admin = require('firebase-admin');
// @ts-ignore
const serviceAccount = require('./service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${process.env.GCLOUD_PROJECT}.firebaseio.com`,
});

// We use Request to make the basic authentication request in our example.
const basicAuthRequest = require('request');


/**
 * Authenticate the provided credentials returning a Firebase custom auth token.
 * `username` and `password` values are expected in the body of the request.
 * If authentication fails return a 401 response.
 * If the request is badly formed return a 400 response.
 * If the request method is unsupported (not POST) return a 403 response.
 * If an error occurs log the details and return a 500 response.
 */
exports.auth = functions.https.onRequest((req, res) => {
  const handleError = (username, error) => {
    functions.logger.error({ User: username }, error);
    return res.sendStatus(500);
  };

  const handleResponse = (username, status, body) => {
    functions.logger.log(
      { User: username },
      {
        Response: {
          Status: status,
          Body: body,
        },
      }
    );
    if (body) {
      return res.status(200).json(body);
    }
    return res.sendStatus(status);
  };

  let username = '';
  try {
    return cors(req, res, async () => {
      // Authentication requests are POSTed, other requests are forbidden
      if (req.method !== 'POST') {
        return handleResponse(username, 403);
      }
      username = req.body.username;
      if (!username) {
        return handleResponse(username, 400);
      }
      const password = req.body.password;
      if (!password) {
        return handleResponse(username, 400);
      }

      // TODO(DEVELOPER): In production you'll need to update the `authenticate` function so that it authenticates with your own credentials system.
      const valid = await authenticate(username, password)
      if (!valid) {
        return handleResponse(username, 401); // Invalid username/password
      }

      // On success return the Firebase Custom Auth Token.
      const firebaseToken = await admin.auth().createCustomToken(username);
      return handleResponse(username, 200, { token: firebaseToken });
    });
  } catch (error) {
    return handleError(username, error);
  }
});

/**
 * Authenticate the provided credentials.
 * TODO(DEVELOPER): In production you'll need to update this function so that it authenticates with your own credentials system.
 * @returns {Promise<boolean>} success or failure.
 */
function authenticate(username, password) {
  // For the purpose of this example use httpbin (https://httpbin.org) and send a basic authentication request.
  // (Only a password of `Testing123` will succeed)
  const authEndpoint = `https://httpbin.org/basic-auth/${username}/Testing123`;
  const creds = {
    auth: {
      user: username,
      pass: password,
    },
  };
  return new Promise((resolve, reject) => {
    basicAuthRequest(authEndpoint, creds, (error, response, body) => {
      if (error) {
        return reject(error);
      }
      const statusCode = response ? response.statusCode : 0;
      if (statusCode === 401) { // Invalid username/password
        return resolve(false);
      }
      if (statusCode !== 200) {
        return reject(new Error(`invalid response returned from ${authEndpoint} status code ${statusCode}`));
      }
      return resolve(true);
    });
  });
}
