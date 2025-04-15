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
"use strict";

const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
admin.initializeApp();

// Authenticate to Algolia Database.
// TODO: Make sure you configure the `algolia.app_id` and `algolia.api_key` Google Cloud environment variables.
const algoliasearch = require("algoliasearch").default;
const client = algoliasearch(
  functions.config().algolia.app_id,
  functions.config().algolia.api_key,
);

// Name fo the algolia index for Blog posts content.
const ALGOLIA_POSTS_INDEX_NAME = "blogposts";

// Updates the search index when new blog entries are created or updated.
exports.indexentry = functions.database
  .ref("/blog-posts/{blogid}/text")
  .onWrite(async (data, context) => {
    const index = client.initIndex(ALGOLIA_POSTS_INDEX_NAME);
    const firebaseObject = {
      text: data.after.val(),
      objectID: context.params.blogid,
    };

    await index.saveObject(firebaseObject);
    return data.after.ref.parent
      .child("last_index_timestamp")
      .set(Date.parse(context.timestamp));
  });

// Starts a search query whenever a query is requested (by adding one to the `/search/queries`
// element. Search results are then written under `/search/results`.
exports.searchentry = functions.database
  .ref("/search/queries/{queryid}")
  .onCreate(async (snap, context) => {
    const index = client.initIndex(ALGOLIA_POSTS_INDEX_NAME);

    const query = snap.val().query;
    const key = snap.key;

    const content = await index.search(query);
    const updates = {
      "/search/last_query_timestamp": Date.parse(context.timestamp),
    };
    updates[`/search/results/${key}`] = content;
    return admin.database().ref().update(updates);
  });
