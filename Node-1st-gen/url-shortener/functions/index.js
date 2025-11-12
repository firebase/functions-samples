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

const functions = require('firebase-functions/v1');
const {onInit} = require('firebase-functions/v1/init');
const {defineSecret} = require('firebase-functions/params');
const { BitlyClient } = require('bitly');
// TODO: Make sure to set the `BITLY_ACCESS_TOKEN` secret using the CLI.
const bitlyAccessToken = defineSecret('BITLY_ACCESS_TOKEN');

let bitly;
onInit(() => {
  bitly = new BitlyClient(bitlyAccessToken.value());
});

// Shorten URL written to /links/{linkID}.
exports.shortenUrl = functions.runWith({secrets: [bitlyAccessToken]}).database.ref('/links/{linkID}').onCreate(async (snap) => {
  const originalUrl = snap.val();
  const response = await bitly.shorten(originalUrl);
  // @ts-ignore
  const shortUrl = response.url;

  return snap.ref.set({
    original: originalUrl,
    short: shortUrl,
  })
});
