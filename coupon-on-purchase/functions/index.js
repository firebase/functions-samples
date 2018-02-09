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
 * After a user has completed a purchase, send them a coupon via FCM valid on their next purchase.
 */
// [START trigger]
exports.sendCouponOnPurchase = functions.analytics.event('in_app_purchase').onLog(event => {
// [END trigger]
  // [START attributes]
  const user = event.data.user;
  const uid = user.userId; // The user ID set via the setUserId API.
  const purchaseValue = event.data.valueInUSD; // Amount of the purchase in USD.
  const userLanguage = user.deviceInfo.userDefaultLanguage; // The user language in language-country format.
  // [END attributes]

  // For purchases above 500 USD, we send a coupon of higher value.
  if (purchaseValue > 500) {
    return sendHighValueCouponViaFCM(uid, userLanguage);
  }
  return sendCouponViaFCM(uid, userLanguage);
});
// [END all]

/**
 * Sends a coupon code via FCM to the given user.
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
          title: 'Thanks for your Purchase!',
          body: 'Get 10% off your next purchase with "COMEBACK10".'
        }
      };

      // Notification in French.
      if (userLanguage.split('-')[0] === 'fr') {
        payload = {
          notification: {
            title: 'Merci pour votre achat!',
            body: 'Obtenez 10% de réduction sur votre prochain achat avec "COMEBACK10".'
          }
        };
      }

      // Send notifications to all tokens.
      return admin.messaging().sendToDevice(tokens, payload);
    }
  });
}

/**
 * Sends a high value coupon vode via FCM to the given user.
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
          title: 'Thanks for your Purchase!',
          body: 'Get 30% off your next purchase with "COMEBACK30".'
        }
      };

      // Notification in French.
      if (userLanguage.split('-')[0] === 'fr') {
        payload = {
          notification: {
            title: 'Merci pour votre achat!',
            body: 'Obtenez 30% de réduction sur votre prochain achat avec "COMEBACK30".'
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
  return admin.database().ref(`/users/${uid}/tokens`).once('value').then(snap => {
    if (snap.exists()) {
      return Object.keys(snap.val());
    }
    return [];
  });
}
