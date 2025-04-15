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
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";

const admin = require("firebase-admin");
const functions = require("firebase-functions/v1");
admin.initializeApp();

// TODO: Make sure you configure the 'dev_motivator.device_token' Google Cloud environment variables.
const deviceToken = functions.config().dev_motivator.device_token;

/**
 * Triggers when the app is opened the first time in a user device and sends a notification to your developer device.
 *
 * The device model name, the city and the country of the user are sent in the notification message
 */
exports.appinstalled = functions.analytics
  .event("first_open")
  .onLog((event) => {
    const user = event.user;
    const payload = {
      notification: {
        title: "You have a new user \uD83D\uDE43",
        body: `${user.deviceInfo.mobileModelName} from ${user.geoInfo.city}, ${user.geoInfo.country}`,
      },
    };

    return admin
      .messaging()
      .send({ token: deviceToken, notification: payload.notification });
  });

/**
 * Triggers when the app is removed from the user device and sends a notification to your developer device.
 * NOTE: for this trigger to  work, you must mark the `app_remove` event as a conversion event in Firebase's
 * Analytics dashboard.
 *
 * The device model name, the city and the country of the user are sent in the notification message
 */
exports.appremoved = functions.analytics.event("app_remove").onLog((event) => {
  const user = event.user;
  const payload = {
    notification: {
      title: "You lost a user \uD83D\uDE1E",
      body: `${user.deviceInfo.mobileModelName} from ${user.geoInfo.city}, ${user.geoInfo.country}`,
    },
  };

  return admin
    .messaging()
    .send({ token: deviceToken, notification: payload.notification });
});
