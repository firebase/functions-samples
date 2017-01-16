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
const dateFormat = require('dateformat');
const cors = require('cors')({origin: true});
// [END import]

// [START all]
/**
 * Returns the server's date. A timestamp is returned by default unless a `format` URL query
 * parameter is specified with which we'll try to format the date.
 *
 * Format must follow the Node dateformat library. See: https://www.npmjs.com/package/dateformat
 *
 * Example format: "yyyy-mm-dd h:MM:ss".
 */
// [START trigger]
exports.date = functions.https().onRequest((req, res) => {
// [END trigger]
  cors(req, res, () => {
    try {
      // [START readQueryParam]
      const format = req.query.format;
      // [END readQueryParam]
      // [START send]
      const now = Date.now();
      if (format) {
        const formattedDate = dateFormat(now, format);
        console.log('Sending Formatted date:', formattedDate);
        res.send(formattedDate);
      } else {
        console.log('Sending Timestamp:', now);
        res.send(now.toString());
      }
      // [END send]
    // [START sendError]
    } catch (e) {
      res.status(500).send(e.toString());
    }
    // [END sendError]
  });
});
// [END all]
