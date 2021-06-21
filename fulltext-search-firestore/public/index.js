/**
 * Copyright 2017 Google Inc. All Rights Reserved.
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

const PROJECT_ID = '...'          // Required - your Firebase project ID

const ALGOLIA_APP_ID = '...';     // Required - your Algolia app ID
const ALGOLIA_SEARCH_KEY = '...'; // Optional - Only used for unauthenticated search

// A search-only API Typesense API key. NEVER use your Admin API Key in a
// web app. You can generate API keys using either the TypeSense Cloud console
// or the TypeSense API.
const TYPESENSE_SEARCH_API_KEY = '...';

function searchAlgoliaUnauthenticated(query) {

  // [START search_index_unsecure]
  var client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);
  var index = client.initIndex('notes');

  // Perform an Algolia search:
  // https://www.algolia.com/doc/api-reference/api-methods/search/
  return index
    .search({
      query
    })
    .then(function(responses) {
      // Response from Algolia:
      // https://www.algolia.com/doc/api-reference/api-methods/search/#response-format
      console.log(responses.hits);
    });
  // [END search_index_unsecure]
}

function searchAlgoliaAuthenticated(query) {
  var client;
  var index;
  // [START search_index_secure]
  // Use Firebase Authentication to request the underlying token
  return firebase.auth().currentUser.getIdToken()
    .then(function(token) {
      // The token is then passed to our getSearchKey Cloud Function
      return fetch('https://us-central1-' + PROJECT_ID + '.cloudfunctions.net/getSearchKey/', {
          headers: { Authorization: 'Bearer ' + token }
      });
    })
    .then(function(response) {
      // The Fetch API returns a stream, which we convert into a JSON object.
      return response.json();
    })
    .then(function(data) {
      // Data will contain the restricted key in the `key` field.
      client = algoliasearch(ALGOLIA_APP_ID, data.key);
      index = client.initIndex('notes');

      // Perform the search as usual.
      return index.search({query});
    })
    .then(function(responses) {
      // Finally, use the search 'hits' returned from Algolia.
      return responses.hits;
    });
  // [END search_index_secure]
}

function search(query) {
  if (!PROJECT_ID) {
    console.warn('Please set PROJECT_ID in /index.js!');
  } else if (!ALGOLIA_APP_ID) {
    console.warn('Please set ALGOLIA_APP_ID in /index.js!');
  } else if (ALGOLIA_SEARCH_KEY) {
    console.log('Performing unauthenticated search...');
    return searchAlgoliaUnauthenticated(query);
  } else {
    return firebase.auth().signInAnonymously()
      .then(function() {
        return searchAlgoliaAuthenticated(query).catch(function(err) {
          console.warn(err);
        });
      }).catch(function(err) {
        console.warn(err);
        console.warn('Please enable Anonymous Authentication in your Firebase Project!');
      });
  }
}

function searchElastic(query) {
  // [START search_elastic]
  const searchNotes = firebase.functions().httpsCallable('searchNotes');
  searchNotes({ query: query })
    .then((result) => {
      const notes = result.data.notes;
      // ...
    });
  // [END search_elastic]
}

async function searchTypesenseUnauthenticated(query) {
  // [START search_typesense_authenticated]
  // Create a Typesense Client using the search-only API key
  const client = new Typesense.Client({
    'nodes': [{
      'host': 'xxx.a1.typesense.net', // where xxx is the ClusterID of your Typesense Cloud cluster
      'port': '443',
      'protocol': 'https'
    }],
    'apiKey': TYPESENSE_SEARCH_API_KEY,
    'connectionTimeoutSeconds': 2
  });

  // Search for notes with matching text
  const searchParameters = {
    'q': query,
    'query_by': 'text'
  };
  const searchResults = await client.collections('notes')
    .documents()
    .search(searchParameters);
  // ...
  // [END search_typesense_authenticated]
}

async function searchTypesenseAuthenticated(query) {
  // [START search_typesense_authenticated]
  // Get a scoped TypeSense API key from our Callable Function
  const getScopedApiKey = firebase.functions().httpsCallable('getScopedApiKey');
  const scopedApiKeyResponse = await getScopedApiKey();
  const apiKey = scopedApiKeyResponse.data.key;

  // Create a Typesense Client
  const client = new Typesense.Client({
    'nodes': [{
      'host': 'xxx.a1.typesense.net', // where xxx is the ClusterID of your Typesense Cloud cluster
      'port': '443',
      'protocol': 'https'
    }],
    'apiKey': apiKey,
    'connectionTimeoutSeconds': 2
  });

  // Search for notes with matching text
  const searchParameters = {
    'q': query,
    'query_by': 'text'
  };
  const searchResults = await client.collections('notes')
    .documents()
    .search(searchParameters);
  // ...
  // [END search_typesense_authenticated]
}

// Other code to wire up the buttons and textboxes.

document.querySelector('#do-add-note').addEventListener('click', function() {
  firebase.firestore().collection('notes').add({
    owner: [firebase.auth().currentUser.uid],
    text: document.querySelector('#note-text').value
  }).then(function() {
    document.querySelector('#note-text').value = '';
  });
});

document.querySelector('#do-query').addEventListener('click', function() {
  search(document.querySelector('#query-text').value).then(function(hits) {
    document.querySelector('#results').innerHTML = JSON.stringify(hits, null, 2);
  });
});
