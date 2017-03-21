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

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// Authenticate to Algolia Database.
const algoliasearch = require('algoliasearch');

// Updates the search index when new blog entries are created or updated.
exports.indexentry = functions.database.ref('/blog-posts/{blogid}').onWrite(event => {
  // TODO: Make sure you configure the `algolia.key` and `algolia.secret` Google Cloud environment variables.
  const client = algoliasearch(functions.config().algolia.key, functions.config().algolia.secret);
  const index = client.initIndex('users');

  const firebaseObject = event.data.val();
  firebaseObject.objectID = event.data.key;

  return index.saveObject(firebaseObject).then(
      () => admin.database().ref(event.timestamp));
});

// Starts a search query whenever a query is requested (by adding one to the `/search/queries`
// element. Search results are then written under `/search/results`.
exports.searchentry = functions.database.ref('/search/queries/{queryid}').onWrite(event => {
  // TODO: Make sure you configure the `algolia.key` and `algolia.secret` Google Cloud environment variables.
  const client = algoliasearch(functions.config().algolia.key, functions.config().algolia.secret);
  const index = client.initIndex('users');

  const query = event.data.val().query;
  const key = event.data.key;

  return index.search(query).then(content => {
    const updates = {
      '/last_query': event.timestamp
    };
    updates[`/search/results/${key}`] = content;
    return admin.database().ref().update(updates);
  });
});
