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

const functions = require('firebase-functions/v1');

// This is the URL that we will callback and send the content of the updated data node.
// As an example we're using a Request Bin from http://requestb.in
// TODO: Make sure you create your own Request Bin and change this URL to try this sample.
const WEBHOOK_URL = 'http://requestb.in/1mqw97l1';

// Reads the content of the node that triggered the function and sends it to the registered Webhook
// URL.
exports.webhook = functions.database.ref('/hooks/{hookId}').onCreate(async (snap) => {
  const response = await fetch(WEBHOOK_URL, {
    method: 'post',
    body: JSON.stringify(snap.val()),
    headers: {'Content-Type': 'application/json'}
  });

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.statusCode}`);
  }
  functions.logger.log('SUCCESS! Posted', snap.ref);
});
