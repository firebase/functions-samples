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

// [START import]
const functions = require('firebase-functions');
// [END import]

// [START helloWorld]
/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
// [START trigger]
exports.helloWorld = functions.https().onRequest((req, res) => {
// [END trigger]
  if (req.body.message === undefined) {
    // This is an error case, as "message" is required
    res.status(400).send('No message defined!');
  } else {
    // Everything is ok
    console.log(req.body.message);
    res.status(200).end();
  }
});
// [END helloWorld]

// [START helloContent]
/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
exports.helloContent = functions.https().onRequest((req, res) => {
  let name;

  switch (req.get('content-type')) {
      // '{"name":"John"}'
    case 'application/json':
      name = req.body.name;
      break;

      // 'John', stored in a Buffer
    case 'application/octet-stream':
      name = req.body.toString(); // Convert buffer to a string
      break;

      // 'John'
    case 'text/plain':
      name = req.body;
      break;

      // 'name=John'
    case 'application/x-www-form-urlencoded':
      name = req.body.name;
      break;
  }

  res.status(200).send(`Hello ${name || 'World'}!`);
});
// [END helloContent]

// [START helloHttp]
function handleGET(req, res) {
  // Do something with the GET request
  res.status(200).send('Hello World!');
}

function handlePUT(req, res) {
  // Do something with the PUT request
  res.status(403).send('Forbidden!');
}

/**
 * Responds to a GET request with "Hello World!". Forbids a PUT request.
 *
 * @example
 * gcloud alpha functions call helloHttp
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
exports.helloHttp = functions.https().onRequest((req, res) => {
  switch (req.method) {
    case 'GET':
      handleGET(req, res);
      break;
    case 'PUT':
      handlePUT(req, res);
      break;
    default:
      res.status(500).send({error: 'Something blew up!'});
      break;
  }
});
// [END helloHttp]
