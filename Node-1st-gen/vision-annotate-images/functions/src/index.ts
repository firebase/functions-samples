/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as functions from "firebase-functions/v1";
import vision from "@google-cloud/vision";

const client = new vision.ImageAnnotatorClient();

// This will allow only requests with an auth token to access the Vision
// API, including anonymous ones.
// It is highly recommended to limit access only to signed-in users. This may
// be done by adding the following condition to the if statement:
//    || context.auth.token?.firebase?.sign_in_provider === 'anonymous'
//
// For more fine-grained control, you may add additional failure checks, ie:
//    || context.auth.token?.firebase?.email_verified === false
// Also see: https://firebase.google.com/docs/auth/admin/custom-claims
export const annotateImage = functions.https.onCall(async (data, context) => {
  if (!context?.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "annotateImage must be called while authenticated.",
    );
  }
  try {
    return await client.annotateImage(data);
  } catch (e) {
    throw new functions.https.HttpsError("internal", (e as Error).message);
  }
});
