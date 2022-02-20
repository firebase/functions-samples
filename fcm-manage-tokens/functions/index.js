/**
 * Copyright 2022 Google Inc. All Rights Reserved.
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

const admin = require('firebase-admin');
const functions = require('firebase-functions');
const {write} = require("firebase-functions/logger");
admin.initializeApp();

const EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30; // 30 days

/**
 * Callable function that stores/updates the freshness timestamp associated with the
 * submitted FCM registration token.
 *
 * Note: Most FCM registration tokens would be associated with a user. In that case
 * there should be some mapping between the user and the token(s) when stored.
 */
exports.updateToken = functions.https.onCall(async (data, context) => {
  const registrationToken = data['fcm_token'];
  await admin.firestore().collection('tokens').doc(registrationToken).set(
      {timestamp: Date.now()},
      {merge: true}
  );
});

/**
 * Scheduled function that runs once a day. It retrieves all stale tokens then
 * unsubscribes them from 'topic1' then deletes them.
 */
exports.pruneTokens = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const staleTokensResult = await admin.firestore().collection('tokens')
      .where("timestamp", "<", Date.now() - EXPIRATION_TIME)
      .get();

  const staleTokens = staleTokensResult.docs.map(staleTokenDoc => staleTokenDoc.id);

  await admin.messaging().unsubscribeFromTopic(staleTokens, 'topic1');

  const deletePromises = [];
  for (const staleTokenDoc of staleTokensResult.docs) {
      deletePromises.push(staleTokenDoc.ref.delete());
  }
  await Promise.all(deletePromises);
});
