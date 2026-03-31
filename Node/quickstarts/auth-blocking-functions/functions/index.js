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

const {
  beforeUserCreated,
  beforeUserSignedIn,
  beforeEmailSent,
  beforeSmsSent,
  HttpsError,
} = require("firebase-functions/identity");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// [START v2ValidateNewUser]
// [START v2beforeCreateFunctionTrigger]
// Block account creation with any non-acme email address.
exports.validatenewuser = beforeUserCreated((event) => {
  // [END v2beforeCreateFunctionTrigger]
  // [START v2readUserData]
  // User data passed in from the CloudEvent.
  const user = event.data;
  // [END v2readUserData]

  // [START v2domainHttpsError]
  // Only users of a specific domain can sign up.
  if (!user?.email?.includes("@acme.com")) {
    // Throw an HttpsError so that Firebase Auth rejects the account creation.
    throw new HttpsError("invalid-argument", "Unauthorized email");
  }
  // [END v2domainHttpsError]
});
// [END v2ValidateNewUser]

// [START v2CheckForBan]
// [START v2beforeSignInFunctionTrigger]
// Block account sign in with any banned account.
exports.checkforban = beforeUserSignedIn(async (event) => {
  // [END v2beforeSignInFunctionTrigger]
  // [START v2readEmailData]
  // Email passed from the CloudEvent.
  const email = event.data.email || "";
  // [END v2readEmailData]

  // [START v2documentGet]
  // Obtain a document in Firestore of the banned email address.
  const doc = await db.collection("banned").doc(email).get();
  // [END v2documentGet]

  // [START v2bannedHttpsError]
  // Checking that the document exists for the email address.
  if (doc.exists) {
    // Throw an HttpsError so that Firebase Auth rejects the account sign in.
    throw new HttpsError("invalid-argument", "Unauthorized email");
  }
  // [END v2bannedHttpsError]
});
// [START v2CheckForBan]

// [START v2CheckEmailDomain]
// [START v2beforeEmailSentFunctionTrigger]
// Block email sending with any non-acme email address.
exports.checkemaildomain = beforeEmailSent((event) => {
  // [END v2beforeEmailSentFunctionTrigger]
  // [START v2readEmailUser]
  // Email passed in from the CloudEvent.
  const email = event.data?.email || event.additionalUserInfo?.email;
  // [END v2readEmailUser]

  // [START v2emailHttpsError]
  // Only users of a specific domain can receive emails.
  if (!email?.includes("@acme.com")) {
    // Throw an HttpsError so that Firebase Auth rejects the email sending.
    throw new HttpsError("invalid-argument", "Unauthorized email");
  }
  // [END v2emailHttpsError]
});
// [END v2CheckEmailDomain]

// [START v2CheckPhoneNumber]
// [START v2beforeSmsSentFunctionTrigger]
// Block SMS sending with any non-US phone number.
exports.checkphonenumber = beforeSmsSent((event) => {
  // [END v2beforeSmsSentFunctionTrigger]
  // [START v2readSmsUser]
  // Phone number passed from the CloudEvent.
  const phoneNumber = event.data?.phoneNumber ||
    event.additionalUserInfo?.phoneNumber;
  // [END v2readSmsUser]

  // [START v2smsHttpsError]
  // Only users of a specific region can receive SMS.
  if (!phoneNumber?.startsWith("+1")) {
    // Throw an HttpsError so that Firebase Auth rejects the SMS sending.
    throw new HttpsError("invalid-argument", "Unauthorized phone number");
  }
  // [END v2smsHttpsError]
});
// [END v2CheckPhoneNumber]
