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
// TODO: Make sure you configure the `algolia.appId` and `algolia.apiKey` Google Cloud environment variables.
const algoliasearch = require('algoliasearch');
const client = algoliasearch(functions.config().algolia.appId, functions.config().algolia.apiKey);

// Name fo the algolia index for Blog posts content.
const ALGOLIA_POSTS_INDEX_NAME = 'blogposts';

// Updates the search index when new blog entries are created or updated.
exports.indexentry = functions.database.ref('/blog-posts/{blogid}').onWrite(event => {
  const index = client.initIndex(ALGOLIA_POSTS_INDEX_NAME);
  const firebaseObject = event.data.val();
  firebaseObject.objectID = event.data.key;

  return index.saveObject(firebaseObject).then(
      () => event.data.adminRef.child('last_index_timestamp').set(Date.parse(event.timestamp).getTime()));
});

// Starts a search query whenever a query is requested (by adding one to the `/search/queries`
// element. Search results are then written under `/search/results`.
exports.searchentry = functions.database.ref('/search/queries/{queryid}').onWrite(event => {
  const index = client.initIndex(ALGOLIA_POSTS_INDEX_NAME);

  const query = event.data.val().query;
  const key = event.data.key;

  return index.search(query).then(content => {
    const updates = {
      '/search/last_query_timestamp': Date.parse(event.timestamp).getTime()
    };
    updates[`/search/results/${key}`] = content;
    return admin.database().ref().update(updates);
  });
});
