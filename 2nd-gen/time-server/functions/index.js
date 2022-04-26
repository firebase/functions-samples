/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

// [START functionsimport]
const functions = require('firebase-functions/v2');
// [END functionsimport]
// [START additionalimports]
// Moments library to format dates.
const moment = require('moment');
// [END additionalimports]

// [START all]
/**
 * Returns the server's date. Options `timeoutSeconds` and `region` are optional.
 *
 * You must provide a `format` URL query parameter or `format` value in
 * the request body with which we'll try to format the date.
 *
 * Format must follow the Node moment library. See: http://momentjs.com/
 *
 * Example format: "MMMM Do YYYY, h:mm:ss a".
 * Example request using URL query parameters:
 *   https://us-central1-<project-id>.cloudfunctions.net/date?format=MMMM%20Do%20YYYY%2C%20h%3Amm%3Ass%20a
 * Example request using request body with cURL:
 *   curl -H 'Content-Type: application/json' /
 *        -d '{"format": "MMMM Do YYYY, h:mm:ss a"}' /
 *        https://us-central1-<project-id>.cloudfunctions.net/date
 */
// [START trigger]
exports.date = functions.https.onRequest({ timeoutSeconds: 1200, region: ["us-west1", "us-central3"] }, (req, res) => {
  // [END trigger]
  // [START sendError]
  // Forbidding PUT requests.
  if (req.method === 'PUT') {
    res.status(403).send('Forbidden!');
    return;
  }
  // [END sendError]
 
  // Reading date format from URL query parameter.
  // [START readQueryParam]
  let format = req.query.format;
  // [END readQueryParam]

  // Reading date format from request body query parameter
  if (!format) {
    // [START readBodyParam]
    format = req.body.format;
    // [END readBodyParam]
  }

  // [START sendResponse]
  const formattedDate = moment().format(`${format}`);
  functions.logger.log('Sending formatted date:', formattedDate);
  res.status(200).send(formattedDate);
  // [END sendResponse]
});
// [END all]
