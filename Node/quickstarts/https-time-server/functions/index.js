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
"use strict";

// [START v2httpImport]
const {onRequest} = require("firebase-functions/v2/https");
// [END v2httpImport]

// [START v2httpAdditionalImports]
const logger = require("firebase-functions/logger");
// Moments library to format dates.
const moment = require("moment");
// [END v2httpAdditionalImports]

// [START v2httpAll]
/**
 * Returns the server's date.
 * Options `timeoutSeconds` and `region` are optional.
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
// [START v2httpTrigger]
exports.date = onRequest(
    {timeoutSeconds: 1200, region: ["us-west1", "us-east1"]},
    (req, res) => {
    // [END v2httpTrigger]

      // [START v2httpSendError]
      // Forbidding PUT requests.
      if (req.method === "PUT") {
        res.status(403).send("Forbidden!");
        return;
      }
      // [END v2httpSendError]

      // Reading date format from URL query parameter.
      // [START v2httpReadQueryParam]
      let format = req.query.format;
      // [END v2httpReadQueryParam]

      // Reading date format from request body query parameter
      if (!format) {
      // [START v2httpReadBodyParam]
        format = req.body.format;
      // [END v2httpReadBodyParam]
      }

      // [START v2httpSendResponse]
      const formattedDate = moment().format(`${format}`);
      logger.log("Sending formatted date:", formattedDate);
      res.status(200).send(formattedDate);
    // [END v2httpSendResponse]
    },
);
// [END v2httpAll]
