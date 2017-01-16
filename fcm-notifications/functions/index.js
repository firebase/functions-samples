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
const rp = require('request-promise-native');

/**
 * Triggers when a user gets a new follower and sends a notification.
 *
 * Followers add a flag to `followers/{followedUid}/{followerUid}`.
 * Users save their device notification tokens to `users/{followedUid}/notificationTokens/{notificationToken}`.
 */
exports.sendFollowerNotification = functions.database().path('followers/{followedUid}/{followerUid}').onWrite(event => {
  const followerUid = event.params.followerUid;
  const followedUid = event.params.followedUid;
  // If un-follow we exit the function.
  if (!event.data.val()) {
    return console.log('User ', followerUid, 'un-followed user', followedUid);
  }
  console.log('We have a new follower UID:', followerUid, 'for user:', followerUid);

  // Get the list of device notification tokens.
  const getNotificationTokensPromise = firebaseAdmin.database().ref(`users/${followedUid}/notificationTokens`).once('value');

  // Get the follower profile.
  const getFollowerProfilePromise = firebaseAdmin.auth().getUser(followerUid);

  return Promise.all([getNotificationTokensPromise, getFollowerProfilePromise]).then(results => {
    const tokensSnapshot = results[0];
    const follower = results[1];

    // Check if there are any device tokens.
    if (!tokensSnapshot.hasChildren()) {
      return console.log('There are no notification tokens to send to.');
    }
    console.log('There are', tokensSnapshot.numChildren(), 'tokens to send notifications to.');
    console.log('Fetched follower profile', follower);
    const displayName = follower.displayName;
    const profilePic = follower.photoURL;

    // Sends notifications to all tokens.
    const notificationPromises = [];
    tokensSnapshot.forEach(tokenSnapshot => {
      const token = tokenSnapshot.key;
      const notificationPromise = sendNotification(displayName, token, followedUid, profilePic);
      notificationPromises.push(notificationPromise);
    });

    return Promise.all(notificationPromises).then(() => {
      console.log('Marked notification as sent.');
      console.log('Finished sending notifications.');
    });
  });
});

/**
 * Sends a "New follower" notification to the given `token`.
 * Removes/cleans up the token from the database if they are not registered anymore.
 */
function sendNotification(displayName, token, followedUid, profilePic) {
  // Prepare the REST request to the Firebase Cloud Messaging API.
  var options = {
    method: 'POST',
    uri: 'https://fcm.googleapis.com/fcm/send',
    headers: {
      Authorization: `key=${functions.env.firebase.apiKey}`
    },
    body: {
      notification: {
        title: 'You have a new follower!',
        body: `${displayName} is now following you.`,
        icon: profilePic || 'https://ssl.gstatic.com/images/icons/material/product/1x/avatar_square_blue_120dp.png'
      },
      to: token
    },
    json: true
  };

  // Send the REST request to the Firebase Cloud Messaging API.
  return rp(options).then(resp => {
    console.log('Sent a notification.', resp.success ? 'Success' : 'Failure');

    // Cleanup the tokens who are not registered anymore.
    if (resp.failure && resp.results[0].error === 'NotRegistered') {
      return firebaseAdmin.database().ref(`users/${followedUid}/notificationTokens/${token}`).remove().then(() => {
        console.log('Removed unregistered token.');
      });
    }
  });
}
