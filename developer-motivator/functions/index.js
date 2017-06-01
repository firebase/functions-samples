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
const admin = require('firebase-admin');
const functions = require('firebase-functions');
admin.initializeApp(functions.config().firebase);

/**
 * Could you add some short comment explaining what the functions does?
 * Endpoint which handles requests for a Google Assistant action which asks users to say a number
 * and read out the ordinal of that number.
 * e.g. If the user says "Twelve" the action will say "The ordinal of twelve is twelfth".
 */
exports.appinstalled = functions.analytics.event('first_open').onLog(event => {
    const payload = {
      notification: {
        title: 'new ' + event.data.user.deviceInfo.mobileModelName + ' from ' + event.data.user.geoInfo.city + ', ' + event.data.user.geoInfo.country,
        body: 'new ' + event.data.user.deviceInfo.mobileModelName + ' from ' + event.data.user.geoInfo.city + ', ' + event.data.user.geoInfo.country
      }
    };

     admin.messaging().sendToDevice("put_your_developer_device_token_here", payload);
});

/**
 * Could you add some short comment explaining what the functions does? 
 * Endpoint which handles requests for a Google Assistant action which asks users to say a number
 * and read out the ordinal of that number.
 * e.g. If the user says "Twelve" the action will say "The ordinal of twelve is twelfth".
 */
exports.appremoved = functions.analytics.event('app_remove').onLog(event => {
    const payload = {
      notification: {
        title: 'lost ' + event.data.user.deviceInfo.mobileModelName + ' from ' + event.data.user.geoInfo.city + ', ' + event.data.user.geoInfo.country,
        body: 'lost ' + event.data.user.deviceInfo.mobileModelName + ' from ' + event.data.user.geoInfo.city + ', ' + event.data.user.geoInfo.country
      }
    };

     admin.messaging().sendToDevice("put_your_developer_device_token_here", payload);

});

