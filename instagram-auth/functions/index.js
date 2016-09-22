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
  databaseURL: 'https://' + process.env.GCLOUD_PROJECT + '.firebaseio.com'
});
const oauth2 = require('simple-oauth2')({
  clientID: functions.env.get('instagram.clientId'),
  clientSecret: functions.env.get('instagram.clientSecret'),
  site: 'https://api.instagram.com',
  tokenPath: '/oauth/access_token',
  authorizationPath: '/oauth/authorize'
});

const OAUTH_REDIRECT_URI = `https://${process.env.GCLOUD_PROJECT}.firebaseapp.com/popup.html`;
const OAUTH_SCOPES = 'basic';

/**
 * Redirects the User to the Instagram authentication consent screen. Also the 'state' cookie is set for later state
 * verification.
 */
exports.redirect = functions.cloud.http().on('request', (req, res) => {
  cookieParser()(req, res, () => {
    try {
      const state = req.cookies.state || crypto.randomBytes(20).toString('hex');
      console.log('Setting verification state:', state);
      res.cookie('state', state.toString(), {maxAge: 3600000, secure: true, httpOnly: true});
      const redirectUri = oauth2.authCode.authorizeURL({
        redirect_uri: OAUTH_REDIRECT_URI,
        scope: OAUTH_SCOPES,
        state: state
      });
      console.log('Redirecting to:', redirectUri);
      res.redirect(redirectUri);
    } catch (e) {
      res.status(500).send(e.toString());
    }
  });
});

/**
 * Exchanges a given Instagram auth code passed in the 'code' URL query parameter for a Firebase auth token.
 * The request also needs to specify a 'state' query parameter which will be checked against the 'state' cookie.
 * The Firebase custom auth token is sent back in a JSONP callback function with function name defined by the
 * 'callback' query parameter.
 */
exports.token = functions.cloud.http().on('request', (req, res) => {
  try {
    cookieParser()(req, res, () => {
      console.log('Received verification state:', req.cookies.state);
      console.log('Received state:', req.query.state);
      if (!req.cookies.state) {
        throw new Error('State cookie not set or expired. Maybe you took too long to authorize. Please try again.');
      } else if (req.cookies.state !== req.query.state) {
        throw new Error('State validation failed');
      }
      console.log('Received auth code:', req.query.code);
      oauth2.authCode.getToken({
        code: req.query.code,
        redirect_uri: OAUTH_REDIRECT_URI
      }).then(results => {
        console.log('Auth code exchange result received:', results);
        const firebaseAccount = createFirebaseToken(results.user.id);
        return updateAccount(firebaseAccount.token, firebaseAccount.uid,
                             results.user.full_name, results.user.profile_picture)
            .then(() => res.jsonp({token: firebaseAccount.token}));
      });
    });
  } catch (error) {
    return res.jsonp({error: error.toString});
  }
});

/**
 * Creates a Firebase custom auth token for the given Instagram user ID.
 *
 * @returns {Object} The Firebase custom auth token and the uid.
 */
function createFirebaseToken(digitsUID) {
  // The UID we'll assign to the user.
  const uid = `instagram:${digitsUID}`;

  // Create the custom token.
  const token = firebase.app().auth().createCustomToken(uid);
  console.log('Created Custom token for UID "', uid, '" Token:', token);
  return {token: token, uid: uid};
}

/**
 * Updates the user with the given displayName and photoURL. Updates the Firebase user profile with the
 * displayName if needed.
 *
 * @returns {Promise} Promise that completes when all the updates have been completed.
 */
function updateAccount(token, uid, displayName, photoURL) {
  // Create a Firebase app we'll use to authenticate as the user.
  const userApp = firebase.initializeApp({
    apiKey: functions.env.get('firebaseConfig.apiKey')
  }, uid);

  // Authenticate as the user, updates the email and profile Pic.
  return userApp.auth().signInWithCustomToken(token).then(user => {
    if (displayName !== user.displayName || photoURL !== user.photoURL) {
      console.log('Updating profile of user', uid, 'with', {displayName: displayName, photoURL: photoURL});
      return user.updateProfile({displayName: displayName, photoURL: photoURL}).then(() => userApp.delete());
    }
    return userApp.delete();
  }).catch(e => {
    userApp.delete();
    throw e;
  });
}
