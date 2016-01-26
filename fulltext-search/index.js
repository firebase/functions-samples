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

// Authenticate to Algolia Database.
// TODO: Make sure you add your Algolia Key and Secret into env.json
var algoliasearch = require('algoliasearch');
var client = algoliasearch(env.get('algolia.key'), env.get('algolia.secret'));
var index = client.initIndex('users');

ref.child("search").remove();

function index_entry(context, data) {
  ref.child(data.path).once("value", function (dataSnapshot) {
    var firebaseObject = dataSnapshot.val();
    firebaseObject.objectID = dataSnapshot.key();

    index.saveObject(firebaseObject, function(err, content) {
      if (err) throw err;
      ref.child('last_index').set(Firebase.ServerValue.TIMESTAMP);
      context.done();
    });
  });
}

function search_entry(context, data) {
  ref.child('last_query').set(Firebase.ServerValue.TIMESTAMP);
  ref.child(data.path).once("value", function (dataSnapshot) {
    var query = dataSnapshot.val(),
        key = dataSnapshot.key();

    index.search(query, function searchDone(err, content) {
      ref.child("search/results").child(key).set(content);
      context.done();
    });
  });
}

module.exports = {
  "index-entry": index_entry,
  "search-entry": search_entry
}