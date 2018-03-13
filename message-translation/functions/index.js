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

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const translate = require('@google-cloud/translate')();

// List of output languages.
const LANGUAGES = ['en', 'es', 'de', 'fr', 'sv', 'ga', 'it', 'jp'];

// Translate an incoming message.
exports.translate = functions.database.ref('/messages/{languageID}/{messageID}').onWrite((event) => {
  const snapshot = event.data;
  if (snapshot.val().translated) {
    return null;
  }
  const promises = [];
  for (let i = 0; i < LANGUAGES.length; i++) {
    const language = LANGUAGES[i];
    if (language !== event.params.languageID) {
      promises.push(translate.translate(snapshot.val().message, {from: event.params.languageID, to: language}).then(
          (results) => {
            return admin.database().ref(`/messages/${language}/${snapshot.key}`).set({
              message: results[0],
              translated: true,
            });
          }));
    }
  }
  return Promise.all(promises);
});
