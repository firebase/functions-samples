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
const firebaseAdmin = require('firebase-admin');
const serviceAccount = require('./service-account.json');
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});
const google = require('googleapis');
const rp = require('request-promise');
const promisePool = require('es6-promise-pool');
const PromisePool = promisePool.PromisePool;
const MAX_CONCURRENT = 3;

/**
 * When requested this Function will delete every user accounts that has been inactive for 30 days.
 * The request needs to be authorized by passing a 'key' query parameter in the URL. This key must
 * match a key set as an environment variable using `firebase env:set cron.key="YOUR_KEY"`.
 */
exports.accountcleanup = functions.https().onRequest((req, res) => {
  const key = req.query.key;

  // Exit if the keys don't match
  if (key !== functions.env.cron.key) {
    console.log('The key provided in the request does not match the key set in the environment. Check that', key,
        'matches the cron.key attribute in `firebase env:get`');
    res.status(403).send('Security key does not match. Make sure your "key" URL query parameter matches the ' +
        'cron.key environment variable.');
    return;
  }

  // Fetch all user details.
  getUsers().then(users => {
    // Find users that have not signed in in the last 30 days.
    const inactiveUsers = users.filter(
        user => parseInt(user.lastLoginAt, 10) > Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Use a pool so that we delete maximum `MAX_CONCURRENT` users in parallel.
    const promisePool = new PromisePool(() => {
      if (inactiveUsers.length > 0) {
        const userToDelete = inactiveUsers.pop();

        // Delete the inactive user.
        return firebaseAdmin.auth().deleteUser(userToDelete.uid).then(() => {
          console.log('Deleted user account', userToDelete.uid, 'because of inactivity');
        }).catch(error => {
          console.error('Deletion of inactive user account', userToDelete.uid, 'failed:', error);
        });
      }
    }, MAX_CONCURRENT);

    promisePool.start().then(() => {
      console.log('User cleanup finished');
      res.send('User cleanup finished');
    });
  });
});

/**
 * Returns the list of all users with their ID and lastLogin timestamp.
 */
function getUsers(userIds = [], nextPageToken, accessToken) {
  return getAccessToken(accessToken).then(accessToken => {
    const options = {
      method: 'POST',
      uri: 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/downloadAccount?fields=users/localId,users/lastLoginAt,nextPageToken&access_token=' + accessToken,
      body: {
        nextPageToken: nextPageToken,
        maxResults: 1000
      },
      json: true // Automatically stringifies the body to JSON
    };

    return rp(options).then(resp => {
      if (!resp.users) {
        return userIds;
      }
      if (resp.nextPageToken) {
        return getUsers(resp.users, resp.nextPageToken, accessToken);
      }
      return resp.users;
    });
  });
}

/**
 * Returns an access token using the Service accounts credentials.
 */
function getAccessToken(accessToken) {
  if (accessToken) {
    return Promise.resolve(accessToken);
  }

  const jwtClient = new google.auth.JWT(serviceAccount.client_email, null,
          serviceAccount.private_key, ['https://www.googleapis.com/auth/firebase'], null);

  return new Promise((resolve, reject) => {
    jwtClient.authorize((error, token) => {
      if (error) {
        console.error('Error while fetching access token for Service accounts', error);
        return reject();
      }
      resolve(token.access_token);
    });
  });
}
