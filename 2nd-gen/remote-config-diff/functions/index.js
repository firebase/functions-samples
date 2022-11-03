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

// [START all]
// [START import]
// The Cloud Functions for Firebase SDK to create v2 Cloud Functions and set up triggers.
const { onConfigUpdated } = require('firebase-functions/v2/remoteConfig');
const logger = require('firebase-functions/logger');
// The Firebase Admin SDK to obtain access tokens.
const admin = require('firebase-admin');
admin.initializeApp();
const fetch = require('node-fetch');
const jsonDiff = require('json-diff');
// [END import]

// [START showconfigdiff]
exports.showconfigdiff = onConfigUpdated((event) => {
  // Obtain the access token from the admin SDK
  return admin.credential.applicationDefault().getAccessToken()
    .then(accessTokenObj => {
      return accessTokenObj.access_token;
    })
    .then(accessToken => {
      // Get the version number from the event object
      const currentVersion = event.data.versionNumber;
      const templatePromises = [];
      templatePromises.push(getTemplate(currentVersion, accessToken));
      templatePromises.push(getTemplate(currentVersion - 1, accessToken));
      // Get the templates
      return Promise.all(templatePromises);
    })
    .then(results => {
      const currentTemplate = results[0];
      const previousTemplate = results[1];
      // Figure out the differences of the templates
      const diff = jsonDiff.diffString(previousTemplate, currentTemplate);
      // Log the difference
      logger.log(diff);

      return null;
    }).catch(error => {
      logger.error(error);
      return null;
    });
});
// [END showconfigdiff]

// [START getTemplate]
async function getTemplate(version, accessToken) {
  const params = new URLSearchParams();
  params.append("versionNumber", version);
  const response = await fetch(
    "https://firebaseremoteconfig.googleapis.com/v1/projects/remote-config-function/remoteConfig",
    {
      method: "POST",
      body: params,
      headers: { Authorization: "Bearer " + accessToken },
    }
  );
  return response.json();
}
// [END getTemplate]
// [END all]
