/**
 * Copyright 2021 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* eslint no-unused-vars: ["off"] */
const functions = require("firebase-functions/v1");

// [START init_elastic]
const { Client } = require("@elastic/elasticsearch");

// Initialize Elastic, requires installing Elastic dependencies:
// https://github.com/elastic/elasticsearch-js
//
// ID, username, and password are stored in functions config variables
const ELASTIC_ID = functions.config().elastic.id;
const ELASTIC_USERNAME = functions.config().elastic.username;
const ELASTIC_PASSWORD = functions.config().elastic.password;

const client = new Client({
  cloud: {
    id: ELASTIC_ID,
    username: ELASTIC_USERNAME,
    password: ELASTIC_PASSWORD,
  },
});
// [END init_elastic]

// [START update_index_function_elastic]
// Update the search index every time a blog post is written.
exports.onNoteCreated = functions.firestore
  .document("notes/{noteId}")
  .onCreate(async (snap, context) => {
    // Get the note document
    const note = snap.data();

    // Use the 'nodeId' path segment as the identifier for Elastic
    const id = context.params.noteId;

    // Write to the Elastic index
    client.index({
      index: "notes",
      id,
      body: note,
    });
  });
// [END update_index_function_elastic]

// [START search_function_elastic]
exports.searchNotes = functions.https.onCall(async (data, context) => {
  const query = data.query;

  // Search for any notes where the text field contains the query text.
  // For more search examples see:
  // https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/search_examples.html
  const searchRes = await client.search({
    index: "notes",
    body: {
      query: {
        query_string: {
          query: `*${query}*`,
          fields: ["text"],
        },
      },
    },
  });

  // Each entry will have the following properties:
  //   _score: a score for how well the item matches the search
  //   _source: the original item data
  const hits = searchRes.body.hits.hits;

  const notes = hits.map((h) => h["_source"]);
  return {
    notes: notes,
  };
});
// [END search_function_elastic]
