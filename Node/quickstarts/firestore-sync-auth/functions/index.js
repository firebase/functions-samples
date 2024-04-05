/**
 * Copyright 2023 Google Inc. All Rights Reserved.
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
"use strict";

// [START all]
// [START import]
// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
const {
  onDocumentWrittenWithAuthContext,
} = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");

exports.verifyComment = onDocumentWrittenWithAuthContext(
  "comments/{commentId}",
  (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.log("No data associated with the event");
      return;
    }
    const data = snapshot.data();

    // retrieve auth context from event
    const { authType, authId } = event;

    let verified = false;
    if (authType === "system") {
      // system-generated users are automatically verified
      verified = true;
    } else if (authType === "unknown" || authType === "unauthenticated") {
      // admin users from a specific domain are verified
      if (authId.endsWith("@example.com")) {
        verified = true;
      }
    }

    // add auth medadata to the document
    return data.after.ref.set(
      {
        created_by: authId,
        verified,
      },
      { merge: true }
    );
  }
);

// [END all]
