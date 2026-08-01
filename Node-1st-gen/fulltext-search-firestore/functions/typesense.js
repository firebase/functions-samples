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
const functions = require('firebase-functions/v1');
const {onInit} = require('firebase-functions/v1/init');
const {defineSecret} = require('firebase-functions/params');

// [START init_typesense]
// Initialize Typesense, requires installing Typesense dependencies:
// https://github.com/typesense/typesense-js
const Typesense = require("typesense");

// Typesense API keys are stored in functions config variables
const typesenseAdminApiKey = defineSecret('TYPESENSE_ADMIN_API_KEY');
const typesenseSearchApiKey = defineSecret('TYPESENSE_SEARCH_API_KEY');

let client;
onInit(() => {
  client = new Typesense.Client({
    'nodes': [{
      'host': 'xxx.a1.typesense.net', // where xxx is the ClusterID of your Typesense Cloud cluster
      'port': '443',
      'protocol': 'https'
    }],
    'apiKey': typesenseAdminApiKey.value(),
    'connectionTimeoutSeconds': 2
  });
});
// [END init_typesense]

// [START update_index_function_typesense]
// Update the search index every time a blog post is written.
exports.onNoteWritten = functions.runWith({secrets: [typesenseAdminApiKey]}).firestore.document('notes/{noteId}').onWrite(async (snap, context) => {
  // Use the 'nodeId' path segment as the identifier for Typesense
  const id = context.params.noteId;

  // If the note is deleted, delete the note from the Typesense index
  if (!snap.after.exists) {
    await client.collections('notes').documents(id).delete();
    return;
  }

  // Otherwise, create/update the note in the the Typesense index
  const note = snap.after.data();
  await client.collections('notes').documents().upsert({
    id,
    owner: note.owner,
    text: note.text
  });
});
// [END update_index_function_typesense]

// [START api_key_function_typesense]
exports.getScopedApiKey = functions.runWith({secrets: [typesenseAdminApiKey, typesenseSearchApiKey]}).https.onCall(async (data, context) => {
  // Ensure that the user is authenticated with Firebase Auth
  if (!(context.auth && context.auth.uid)) {
    throw new functions.https.HttpsError('permission-denied', 'Must be signed in!');
  }

  // Generate a scoped API key which allows the user to search ONLY
  // documents which belong to them (based on the 'owner' field).
  const scopedApiKey = client.keys().generateScopedSearchKey(
    typesenseSearchApiKey.value(),
    { 
      'filter_by': `owner:${context.auth.uid}`
    }
  );

  return {
    key: scopedApiKey
  };
});
// [END api_key_function_typesense]
