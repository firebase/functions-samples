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

/**
 * This exports a function that checks for shouting when messages are written
 * to a Firebase Database and makes these messages all lowercase.
 *
 * For more information on setting up and running this sample code, see
 * https://developers.google.com/firebase/docs/functions/writing-functions
 */

'use strict';

// [START imports]
const functions = require('firebase-functions');
// [END imports]

// [START function]
// Listen to /messages/* for writes
// Because the functions writes back to the same path that triggers onWrite,
// carefully manage infinite loops.
exports.makeUpperCase = functions.database().path('/messages/{childId}')
    .onWrite(event => {
      // Access the current value.
      var written = event.data.val();
      // Don't do anything (return null) if the message is not all uppercase.
      // This also prevents infinite loops.
      if (written !== written.toUpperCase()) { return null; }
      // Log this message (event.params.childId is pulled from the path)
      console.log('Shouting in the message!', event.params.childId, written);
      // Return a promise that changes the value stored
      return event.data.ref.set(written.toLowerCase());
    });
// [END function]
