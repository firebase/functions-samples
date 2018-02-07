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

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const rp = require('request-promise');
const promisePool = require('es6-promise-pool');
const PromisePool = promisePool.PromisePool;
const secureCompare = require('secure-compare');
// Maximum concurrent account deletions.
const MAX_CONCURRENT = 3;

/**
 * When requested this Function will delete every user accounts that has been inactive for 30 days.
 * The request needs to be authorized by passing a 'key' query parameter in the URL. This key must
 * match a key set as an environment variable using `firebase functions:config:set cron.key="YOUR_KEY"`.
 */
exports.accountcleanup = functions.https.onRequest((req, res) => {
  const key = req.query.key;

  // Exit if the keys don't match
  if (!secureCompare(key, functions.config().cron.key)) {
    console.log('The key provided in the request does not match the key set in the environment. Check that', key,
      'matches the cron.key attribute in `firebase env:get`');
    res.status(403).send('Security key does not match. Make sure your "key" URL query parameter matches the ' +
      'cron.key environment variable.');
    return null;
  }

  // Fetch all user details.
  return getUsers();
}).then(users => {
    // Find users that have not signed in in the last 30 days.
    const inactiveUsers = users.filter(
      user => parseInt(user.lastLoginAt, 10) < Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Use a pool so that we delete maximum `MAX_CONCURRENT` users in parallel.
    const promisePool = new PromisePool(() => {
      if (inactiveUsers.length > 0) {
        const userToDelete = inactiveUsers.pop();
        // Delete the inactive user.
        return admin.auth().deleteUser(userToDelete.localId);
      }
      return reject();
    }, MAX_CONCURRENT);

    return promisePool.start();
  }).then(() => {
    return console.log('Deleted user account', userToDelete.localId, 'because of inactivity');
  }).catch(error => {
    console.error('Deletion of inactive user account', userToDelete.localId, 'failed:', error);
  }).then(() => {
    console.log('User cleanup finished');
    return res.send('User cleanup finished');
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
      json: true
    };

    return rp(options)
  }).then(resp => {
    if (!resp.users) {
      return userIds;
    }
    if (resp.nextPageToken) {
      return getUsers(userIds.concat(resp.users), resp.nextPageToken, accessToken);
    }
    return userIds.concat(resp.users);
  });
}

/**
 * Returns an access token using the Google Cloud metadata server.
 */
function getAccessToken(accessToken) {
  // If we have an accessToken in cache to re-use we pass it directly.
  if (accessToken) {
    return Promise.resolve(accessToken);
  }

  const options = {
    uri: 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
    headers: {'Metadata-Flavor': 'Google'},
    json: true
  };

  return rp(options).then(resp => resp.access_token);
}
