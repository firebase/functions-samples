/**
 * Copyright 2022 Google Inc. All Rights Reserved.
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
"use strict";

// [START all]
// [START import]
// The Cloud Functions for Firebase SDK to set up triggers and logging.
const {onTestMatrixCompleted} = require("firebase-functions/v2/testLab");
const {logger} = require("firebase-functions");
// [END import]

// [START logtestcomplete]
exports.logtestcomplete = onTestMatrixCompleted((event) => {
  // Obtain Test Matrix properties from the CloudEvent
  const {testMatrixId, createTime, state, outcomeSummary} = event.data;

  // Log the properties of the completed Test Matrix
  logger.log(
      `TEST ${testMatrixId} (created at ${createTime}): ${state}. ${
        outcomeSummary || ""
      }`,
  );
});
// [END logtestcomplete]
// [END all]
