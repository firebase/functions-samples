/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const jsonDiff = require('json-diff');

admin.initializeApp();

// [START remote_config_function]
exports.showConfigDiff = functions.remoteConfig.onUpdate(versionMetadata => {
  return admin.credential.applicationDefault().getAccessToken()
    .then(accessTokenObj => {
      return accessTokenObj.access_token;
    })
    .then(accessToken => {
      const currentVersion = versionMetadata.versionNumber;
      const templatePromises = [];
      templatePromises.push(getTemplate(currentVersion, accessToken));
      templatePromises.push(getTemplate(currentVersion - 1, accessToken));

      return Promise.all(templatePromises);
    })
    .then(results => {
      const currentTemplate = results[0];
      const previousTemplate = results[1];

      const diff = jsonDiff.diffString(previousTemplate, currentTemplate);

      functions.logger.log(diff);

      return null;
    }).catch(error => {
      functions.logger.error(error);
      return null;
    });
});
// [END remote_config_function]

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

