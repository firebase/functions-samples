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
'use strict';

const functions = require('firebase-functions');
const {google} = require('googleapis');
const urlshortener = google.urlshortener({
  version: 'v1',
  auth: functions.config().google ? functions.config().google.api_key: undefined,
});

// Shorten URL written to /links/{linkID}.
exports.shortenUrl = functions.database.ref('/links/{linkID}').onCreate((snap) => {
  const originalUrl = snap.val();
  return new Promise((resolve, reject) => {
    urlshortener.url.insert({resource: {longUrl: originalUrl}}, (err, response) => {
      if (err) {
        reject(err);
      } else {
        snap.ref.set({
          original: originalUrl,
          short: response.data.id,
        }).then(() => resolve()).catch(err => reject(err));
      }
    });
  });
});
