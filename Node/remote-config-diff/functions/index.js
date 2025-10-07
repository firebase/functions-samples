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
"use strict";

// [START all]
// [START import]
// The Cloud Functions for Firebase SDK to set up triggers and logging.
const {onConfigUpdated} = require("firebase-functions/remoteConfig");
const logger = require("firebase-functions/logger");
// The Firebase Admin SDK to obtain access tokens.
const admin = require("firebase-admin");
const app = admin.initializeApp();
const fetch = require("node-fetch");
const jsonDiff = require("json-diff");
// [END import]

// [START showconfigdiff]
exports.showconfigdiff = onConfigUpdated(async (event) => {
  try {
    // Obtain the access token from the Admin SDK
    const accessTokenObj = await admin.credential.applicationDefault()
        .getAccessToken();
    const accessToken = accessTokenObj.access_token;

    // Get the version number from the event object
    const remoteConfigApi = "https://firebaseremoteconfig.googleapis.com/v1/" +
        `projects/${app.options.projectId}/remoteConfig`;
    const currentVersion = event.data.versionNumber;
    const prevVersion = currentVersion - 1;
    const templatePromises = [];
    templatePromises.push(fetch(
        remoteConfigApi,
        {
          method: "POST",
          body: new URLSearchParams([["versionNumber", currentVersion + ""]]),
          headers: {Authorization: "Bearer " + accessToken},
        },
    ));
    templatePromises.push(fetch(
        remoteConfigApi,
        {
          method: "POST",
          body: new URLSearchParams([["versionNumber", prevVersion + ""]]),
          headers: {Authorization: "Bearer " + accessToken},
        },
    ));

    // Get the templates
    const responses = await Promise.all(templatePromises);
    const results = responses.map((r) => r.json());
    const currentTemplate = results[0];
    const previousTemplate = results[1];
    // Figure out the differences of the templates
    const diff = jsonDiff.diffString(previousTemplate, currentTemplate);
    // Log the difference
    logger.log(diff);
  } catch (error) {
    logger.error(error);
  }
});
// [END showconfigdiff]
// [END all]
