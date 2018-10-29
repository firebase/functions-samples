/**
 * Copyright 2018 Google Inc. All Rights Reserved.
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
const client = require('hyperdeploy');
const os = require('os');
const path = require('path');
const fs = require('fs');

const firebaseJson = `{
  "hosting": {
    "public": "public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}`;

// Deploys a new static site on every request.
exports.deploySite = functions.https.onRequest((request, response) => {
  // Get the temp dir and create folder structure
  const rootDir = os.tmpdir();
  const deployDir = path.join(rootDir, 'deploy');
  const publicDir = path.join(deployDir, 'public');
  if (!fs.existsSync(deployDir)){
    fs.mkdirSync(deployDir);
  }
  if (!fs.existsSync(publicDir)){
    fs.mkdirSync(publicDir);
  }

  // Write the firebase.json file to deployment directory.
  fs.writeFileSync(path.join(deployDir, '/firebase.json'), firebaseJson);

  // Contents of the new HTML file we want to deploy.
  const indexHtml = `
    <h1>How's it going ${request.query.name ? request.query.name : 'stranger' }?</h1> 
    <h2>I was deployed programmatically at UTC ${Date.now()}</h2>
  `;
  fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtml);

  client.firebaseDeploy({
    // Add the desired firebase project ID here:
    project: '<FIREBASE_PROJECT_ID>',
    // Generate auth token by running `firebase login:ci`
    token: '<FIREBASE_AUTH_TOKEN>',
    cwd: deployDir
  })
  .then(()=> response.send('Success!'))
  .catch(error => response.send('Error occurred:', error));
})
