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
// The Firebase Admin SDK to obtain access tokens.
const admin = require('firebase-admin');
admin.initializeApp();
const rp = require('request-promise');
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
      functions.logger.log(diff);

      return null;
    }).catch(error => {
      functions.logger.error(error);
      return null;
    });
});
// [END showconfigdiff]

// [START getTemplate]
function getTemplate(version, accessToken) {
  const options = {
    uri: 'https://firebaseremoteconfig.googleapis.com/v1/projects/remote-config-function/remoteConfig',
    qs: {
      versionNumber: version
    },
    headers: {
        Authorization: 'Bearer ' + accessToken
    },
    json: true // Automatically parses the JSON string in the response
  };
  
  // Obtain the template from the rest API
  return rp(options).then(resp => {
    return Promise.resolve(resp);
  }).catch(err => {
    functions.logger.error(err);
    return Promise.resolve(null);
  });
}
// [START getTemplate]
// [END all]
