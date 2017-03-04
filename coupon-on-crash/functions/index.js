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

// [START all]
/**
 * After a user has experienced a crash of the app. Send them a coupon via FCM.
 */
// [START trigger]
exports.sendCouponOnCrash = functions.analytics.event('app_exception').onLog(event => {
// [END trigger]
  // [START attributes]
  const user = event.data.user;
  const uid = user.userId; // The user ID set via the setUserId API.
  const lifetimeValue = user.ltvInUSD; // Lifetime Value of the user in USD.
  const userLanguage = user.deviceInfo.userDefaultLanguage; // The user language in language-country format.
  // [END attributes]

  // For users with a lifetime value above 2000 USD we send a coupon of higher value.
  if (lifetimeValue > 2000) {
    return sendHighValueCouponViaFCM(uid, userLanguage);
  }
  return sendCouponViaFCM(uid, userLanguage);
});
// [END all]

/**
 * Sends the given coupon Code via FCM to the list of device tokens.
 *
 * @param {string} uid The UID of the user.
 * @param {string} userLanguage The user language in language-country format.
 */
function sendCouponViaFCM(uid, userLanguage) {
  // Fetching all the user's device tokens.
  return getDeviceTokens(uid).then(tokens => {
    if (tokens.length > 0) {
      // Notification details.
      let payload = {
        notification: {
          title: 'Special Offer!',
          body: 'Get 10$ off your next purchase with "CRASH10".'
        }
      };

      // Notification in French.
      if (userLanguage.split('-')[0] === 'fr') {
        payload = {
          notification: {
            title: 'Offre Speciale!',
            body: 'Obtenez 10$ de réduction sur votre prochain achat avec "CRASH10".'
          }
        };
      }

      // Send notifications to all tokens.
      return admin.messaging().sendToDevice(tokens, payload);
    }
  });
}

/**
 * Sends the given coupon Code via FCM to the list of device tokens.
 *
 * @param {string} uid The UID of the user.
 * @param {string} userLanguage The user language in language-country format.
 */
function sendHighValueCouponViaFCM(uid, userLanguage) {
  // Fetching all the user's device tokens.
  return getDeviceTokens(uid).then(tokens => {
    if (tokens.length > 0) {
      // Notification details.
      let payload = {
        notification: {
          title: 'Special Offer!',
          body: 'Get 30$ off your next purchase with "CRASH30".'
        }
      };

      // Notification in French.
      if (userLanguage.split('-')[0] === 'fr') {
        payload = {
          notification: {
            title: 'Offre Speciale!',
            body: 'Obtenez 30$ de réduction sur votre prochain achat avec "CRASH30".'
          }
        };
      }

      // Send notifications to all tokens.
      return admin.messaging().sendToDevice(tokens, payload);
    }
  });
}

/**
 * Get the Device Tokens for the given user.
 *
 * @param {string} uid The UID of the user.
 */
function getDeviceTokens(uid) {
  return admin.database().ref(`/users/${uid}/tokens`).then(snap => {
    if (snap.exists()) {
      return Object.keys(snap.val());
    }
    return [];
  });
}
