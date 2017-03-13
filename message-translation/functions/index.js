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
const request = require('request-promise');

// List of output languages.
const LANGUAGES = ['en', 'es', 'de', 'fr', 'sv', 'ga', 'it', 'jp'];

// Translate an incoming message.
exports.translate = functions.database.ref('/messages/{languageID}/{messageID}').onWrite(event => {
  const snapshot = event.data;
  if (snapshot.val().translated) {
    return;
  }
  const paths = snapshot.ref.toString().split('/');
  const promises = [];
  for (let i = 0; i < LANGUAGES.length; i++) {
    var language = LANGUAGES[i];
    if (language !== paths[1]) {
      promises.push(createTranslationPromise(paths[1], language, snapshot));
    }
  }
  return Promise.all(promises);
});

// URL to the Google Translate API.
function createTranslateUrl(source, target, payload) {
  return `https://www.googleapis.com/language/translate/v2?key=${functions.config().firebase.apiKey}&source=${source}&target=${target}&q=${payload}`;
}

function createTranslationPromise(source, target, snapshot) {
  const key = snapshot.key;
  const message = snapshot.val().message;
  return request(createTranslateUrl(source, target, message), {resolveWithFullResponse: true}).then(
      response => {
        if (response.statusCode === 200) {
          const data = JSON.parse(response.body).data;
          return admin.database().ref(`/messages/${target}/${key}`)
              .set({message: data.translations[0].translatedText, translated: true});
        }
        throw response.body;
      });
}
