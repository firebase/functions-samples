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
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const firebase = require('firebase');
firebase.initializeApp({
  serviceAccount: require('./service-account.json'),
  databaseURL: `https://${process.env.GCLOUD_PROJECT}.firebaseio.com`
});

const OAUTH_SCOPES = ['r_basicprofile', 'r_emailaddress'];

/**
 * Creates a configured LinkedIn API Client instance.
 */
function linkedInClient() {
  // Instagram OAuth 2 setup
  // TODO: Configure the `linkedIn.clientId` and `linkedIn.clientSecret` Google Cloud environment variables.
  return require('node-linkedin')(
      functions.env.linkedIn.clientId,
      functions.env.linkedIn.clientSecret,
      `https://${process.env.GCLOUD_PROJECT}.firebaseapp.com/popup.html`);
}

/**
 * Redirects the User to the LinkedIn authentication consent screen. ALso the 'state' cookie is set for later state
 * verification.
 */
exports.redirect = functions.cloud.https().onRequest((req, res) => {
  const Linkedin = linkedInClient();

  cookieParser()(req, res, () => {
    const state = req.cookies.state || crypto.randomBytes(20).toString('hex');
    console.log('Setting verification state:', state);
    res.cookie('state', state.toString(), {maxAge: 3600000, secure: true, httpOnly: true});
    Linkedin.auth.authorize(res, OAUTH_SCOPES, state.toString());
  });
});

/**
 * Exchanges a given LinkedIn auth code passed in the 'code' URL query parameter for a Firebase auth token.
 * The request also needs to specify a 'state' query parameter which will be checked against the 'state' cookie.
 * The Firebase custom auth token is sent back in a JSONP callback function with function name defined by the
 * 'callback' query parameter.
 */
exports.token = functions.cloud.https().onRequest((req, res) => {
  const Linkedin = linkedInClient();

  cookieParser()(req, res, () => {
    if (!req.cookies.state) {
      throw new Error('State cookie not set or expired. Maybe you took too long to authorize. Please try again.');
    }
    console.log('Received verification state:', req.cookies.state);
    Linkedin.auth.authorize(OAUTH_SCOPES, req.cookies.state); // Makes sure the state parameter is set
    console.log('Received auth code:', req.query.code);
    console.log('Received state:', req.query.state);
    Linkedin.auth.getAccessToken(res, req.query.code, req.query.state, (error, results) => {
      if (error) {
        throw error;
      }
      console.log('Received Access Token:', results.access_token);
      const linkedin = Linkedin.init(results.access_token);
      linkedin.people.me((error, userResults) => {
        if (error) {
          throw error;
        }
        console.log('Auth code exchange result received:', userResults);
        const token = createFirebaseToken(userResults.id);
        res.jsonp({
          token: token,
          displayName: userResults.formattedName,
          photoURL: userResults.pictureUrl,
          email: userResults.emailAddress,
          linkedInAccessToken: results.access_token
        });
      });
    });
  });
});

/**
 * Creates a Firebase custom auth token for the given LinkedIn user ID.
 *
 * @returns String The Firebase custom auth token.
 */
function createFirebaseToken(linkedInID) {
  // The UID we'll assign to the user.
  const uid = `linkedin:${linkedInID}`;

  // Create the custom token.
  const token = firebase.app().auth().createCustomToken(uid);
  console.log('Created Custom token for UID "', uid, '" Token:', token);
  return token;
}
