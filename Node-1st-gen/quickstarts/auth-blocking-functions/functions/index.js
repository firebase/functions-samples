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

const {functions} = require("firebase-functions/v1");
const {admin} = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// [START v1ValidateNewUser]
// [START v1beforeCreateFunctionTrigger]
// Block account creation with any non-acme email address.
exports.validateNewUser = functions.auth
    .user()
    .beforeCreate((user, context) => {
    // [END v1beforeCreateFunctionTrigger]
    // [START v1readEmailData]
    // Email passed from the User object.
      const email = user.email || "";
      // [END v1readEmailData]

      // [START v1domainHttpsError]
      // Only users of a specific domain can sign up.
      if (!email.includes("acme.com")) {
        // Throwing an HttpsError so that Auth rejects the account creation.
        throw new functions.https.HttpsError(
            "invalid-argument",
            "Unauthorized email",
        );
      }
    // [END v1domainHttpsError]
    });
// [END v1ValidateNewUser]

// [START v1CheckForBan]
// [START v1beforeSignInFunctionTrigger]
// Block account sign in with any banned account.
exports.checkForBan = functions.auth
    .user()
    .beforeSignIn(async (user, context) => {
    // [END v1beforeSignInFunctionTrigger]
    // [START v1readEmailData]
    // Email passed from the User object.
      const email = user.email || "";
      // [END v1readEmailData]

      // [START v1documentGet]
      // Obtain a document in Firestore of the banned email address.
      const doc = await db.collection("banned").doc(email).get();
      // [END v1documentGet]

      // [START v1bannedHttpsError]
      // Checking that the document exists for the email address.
      if (doc.exists) {
      // Throwing an HttpsError so that Auth rejects the account sign in.
        throw new functions.https.HttpsError(
            "invalid-argument",
            "Unauthorized email",
        );
      }
    // [END v1bannedHttpsError]
    });
// [START v1CheckForBan]
