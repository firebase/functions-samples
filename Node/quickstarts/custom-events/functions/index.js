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

// [START import]
const {onCustomEventPublished} = require("firebase-functions/v2/eventarc");
const logger = require("firebase-functions/logger");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");

// [END import]

initializeApp();

// [START imageresizedEvent]
exports.onimageresized = onCustomEventPublished(
    "firebase.extensions.storage-resize-images.v1.complete",
    (event) => {
      logger.info("Received image resize completed event", event);
      // For example, write resized image details into Firestore.
      return getFirestore()
          .collection("images")
          .doc(event.subject.replace("/", "_")) // original file path
          .set(event.data); // resized images paths and sizes
    },
);
// [END imageresizedEvent]
