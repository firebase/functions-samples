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

const {beforeUserCreated, beforeUserSignedIn, HttpsError} = require("firebase-functions/v2/identity");
const {admin} = require("firebase-admin");

admin.initializeApp();
const store = admin.firestore();

// [START v2BlockCreate]
// [START v2beforeCreateFunctionTrigger]
// Block account creation with any non-gmail email address.
exports.blockcreate = beforeUserCreated((event) => {
  // [END v2beforeCreateFunctionTrigger]
  // [START v2readEmailData]
  // Email passed from the CloudEvent.
  const email = event.data.email || "";
  // [END v2readEmailData]

  // [START v2domainHttpsError]
  // Checking that the email is a 'gmail' domain.
  if (!email?.includes("gmail.com")) {
    // Throwing an HttpsError so that the Auth service rejects the account creation.
    throw new HttpsError('invalid-argument', `Unauthorized email ${email}. Only 'gmail' accounts are valid for registration.`);
  }
  // [END v2domainHttpsError]
});
// [END v2BlockCreate]

// [START v2BlockSignIn]
// [START v2beforeSignInFunctionTrigger]
// Block account sign in with any banned account.
exports.blocksignin = beforeUserSignedIn(async (event) => {
  // [END v2beforeSignInFunctionTrigger]
  // [START v2readEmailData]
  // Email passed from the CloudEvent.
  const email = event.data.email || "";
  // [END v2readEmailData]

  // [START v2documentGet]
  // Obtain a document in Firestore of the banned email address.
  const doc = await store.collection("banned").doc(email).get();
  // [END v2documentGet]

  // [START v2bannedHttpsError]
  // Checking that the document exists for the email address.
  if (doc.exists) {
    // Throwing an HttpsError so that the Auth service rejects the account sign in.
    throw new HttpsError('invalid-argument', `Unauthorized email ${email}. Email has been banned and is no longer authorized for sign-in.`);
  }
  // [END v2bannedHttpsError]
});
// [START v2BlockSignIn]
