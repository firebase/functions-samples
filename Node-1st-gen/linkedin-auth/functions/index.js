// @ts-nocheck
// Disable strict type-checking on this legacy JavaScript file against Admin SDK v14 modular definitions when evaluated under monorepo root tsc checkJs.
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

const functions = require('firebase-functions/v1');
const {defineSecret} = require('firebase-functions/params');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

// Firebase Setup
const admin = require('firebase-admin');
// @ts-ignore
const serviceAccount = require('./service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${process.env.GCLOUD_PROJECT}.firebaseio.com`,
});

// Modern LinkedIn OpenID Connect Scopes
const OAUTH_SCOPES = ['openid', 'profile', 'email'];

const linkedinClientId = defineSecret('LINKEDIN_CLIENT_ID');
const linkedinClientSecret = defineSecret('LINKEDIN_CLIENT_SECRET');

function getRedirectUri() {
  return `https://${process.env.GCLOUD_PROJECT}.firebaseapp.com/popup.html`;
}

/**
 * Redirects the User to the LinkedIn authentication consent screen. Also the 'state' cookie is set for later state
 * verification.
 */
exports.redirect = functions.runWith({secrets: [linkedinClientId]}).https.onRequest((req, res) => {
  cookieParser()(req, res, () => {
    const state = req.cookies.state || crypto.randomBytes(20).toString('hex');
    functions.logger.log('Setting verification state:', state);
    res.cookie('state', state.toString(), {
      maxAge: 3600000,
      secure: true,
      httpOnly: true,
    });
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: linkedinClientId.value(),
      redirect_uri: getRedirectUri(),
      state: state.toString(),
      scope: OAUTH_SCOPES.join(' ')
    });
    res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`);
  });
});

async function getLinkedInAccessToken(code, clientId, clientSecret, redirectUri) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret
  });
  const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });
  if (!res.ok) {
    throw new Error(`LinkedIn Token API failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function getLinkedInUserProfile(accessToken) {
  const res = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    throw new Error(`LinkedIn UserInfo failed: ${res.status} ${await res.text()}`);
  }
  return await res.json();
}

/**
 * Exchanges a given LinkedIn auth code passed in the 'code' URL query parameter for a Firebase auth token.
 * The request also needs to specify a 'state' query parameter which will be checked against the 'state' cookie.
 * The Firebase custom auth token is sent back in a JSONP callback function with function name defined by the
 * 'callback' query parameter.
 */
exports.token = functions.runWith({secrets: [linkedinClientId, linkedinClientSecret]}).https.onRequest(async (req, res) => {
  return cookieParser()(req, res, async () => {
    try {
      if (!req.cookies.state) {
        throw new Error('State cookie not set or expired. Maybe you took too long to authorize. Please try again.');
      }
      functions.logger.log('Received verification state:', req.cookies.state);
      if (req.cookies.state !== req.query.state) {
        throw new Error('State query parameter does not match the state cookie.');
      }
      
      functions.logger.log('Received auth code:', req.query.code);
      const accessToken = await getLinkedInAccessToken(
        req.query.code,
        linkedinClientId.value(),
        linkedinClientSecret.value(),
        getRedirectUri()
      );
      
      functions.logger.log('Received Access Token:', accessToken);
      const userResults = await getLinkedInUserProfile(accessToken);
      functions.logger.log('Auth code exchange result received:', userResults);

      const linkedInUserID = userResults.sub;
      const profilePic = userResults.picture;
      const userName = userResults.name;
      const email = userResults.email;

      const firebaseToken = await createFirebaseAccount(linkedInUserID, userName, profilePic, email, accessToken);
      return res.jsonp({ token: firebaseToken });
    } catch (error) {
      functions.logger.error('Token exchange failed:', error);
      return res.jsonp({ error: error.toString() });
    }
  });
});

/**
 * Creates a Firebase account with the given user profile and returns a custom auth token allowing
 * signing-in this account.
 * Also saves the accessToken to the datastore at /linkedInAccessToken/$uid
 */
async function createFirebaseAccount(linkedinID, displayName, photoURL, email, accessToken) {
  const uid = `linkedin:${linkedinID}`;
  const databaseTask = admin.database().ref(`/linkedInAccessToken/${uid}`).set(accessToken);

  const userCreationTask = admin.auth().updateUser(uid, {
    displayName: displayName,
    photoURL: photoURL,
    email: email,
    emailVerified: true,
  }).catch((error) => {
    if (error.code === 'auth/user-not-found') {
      return admin.auth().createUser({
        uid: uid,
        displayName: displayName,
        photoURL: photoURL,
        email: email,
        emailVerified: true,
      });
    }
    throw error;
  });

  await Promise.all([userCreationTask, databaseTask]);
  const token = await admin.auth().createCustomToken(uid);
  functions.logger.log('Created Custom token for UID "', uid, '" Token:', token);
  return token;
}
