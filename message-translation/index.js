/**
 * Copyright 2015 Google Inc. All Rights Reserved.
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

// Create an all access Firebase Database reference.
var Firebase = require('firebase');
var env = require('./env');
var ref = new Firebase(env.get('firebase.database.url'), 'admin');
ref.auth(env.get('firebase.database.token'));

var request = require('request');
var RSVP = require('rsvp');

// List of output languages.
var LANGUAGES = ['en', 'es', 'de', 'fr', 'sv', 'ga', 'it', 'jp'];

// Translate an incoming message.
function translate(context, data) {
  var paths = data.path.split("/");
  var promises = [];
  ref.child(data.path).once('value', function(snap) {
    for (var i = 0; i < LANGUAGES.length; i++) {
      var language = LANGUAGES[i];
      if (language !== paths[1]) {
        promises.push(createTranslationPromise(paths[1], language, snap));
      }
    }
    RSVP.all(promises).then(function(){
      context.done();
    })
  });
}

// URL to the Google Translate API.
// TODO: Change `<YOUR_BROWSER_API_KEY>` by your Google Developers Console project API key.
function createTranslateUrl(source, target, payload) {
  return "https://www.googleapis.com/language/translate/v2?key=<YOUR_BROWSER_API_KEY>&source=" + source +
      "&target=" + target + "&q=" + payload;
}

function createTranslationPromise(source, target, snapshot) {
  var key = snapshot.key();
  var message = snapshot.val()['message']
  return new RSVP.Promise(function(resolve, reject) {
    request(createTranslateUrl(source, target, message), function(err, res, body) {
      if (!err && res.statusCode == 200) {
        var data = JSON.parse(body).data;
        ref.child('messages/' + target + '/' + key)
            .set({message: data["translations"][0]["translatedText"], translated: true});
        resolve();
      }
      reject();
    });
  });
}

module.exports = {
  translate: translate
}