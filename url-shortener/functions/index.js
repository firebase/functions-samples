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
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const request = require('request-promise');

// Shorten URL
exports.shortenUrl = functions.database.ref('/links/{linkID}').onWrite(event => {
  const snapshot = event.data;
  if (typeof snapshot.val() !== 'string') {
    return;
  }
  return createShortenerPromise(snapshot);
});

// URL to the Google URL Shortener API.
function createShortenerRequest(sourceUrl) {
  return {
    method: 'POST',
    uri: `https://www.googleapis.com/urlshortener/v1/url?key=${functions.config().firebase.apiKey}`,
    body: {
      longUrl: sourceUrl
    },
    json: true,
    resolveWithFullResponse: true
  }
}

function createShortenerPromise(snapshot) {
  const key = snapshot.key;
  const originalUrl = snapshot.val();
  return request(createShortenerRequest(originalUrl)).then(response => {
    if (response.statusCode === 200) {
      return response.body.id;
    }
    throw response.body;
  }).then(shortUrl => {
    return admin.database().ref(`/links/${key}`).set({
      original: originalUrl,
      short: shortUrl
    });
  });
}
