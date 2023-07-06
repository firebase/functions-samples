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

const functions = require('firebase-functions/v1');

exports.logTestComplete = functions.testLab
  .testMatrix()
  .onComplete(testMatrix => {
    const { testMatrixId, createTime, state, outcomeSummary } = testMatrix;

    functions.logger.log(
      `TEST ${testMatrixId} (created at ${createTime}): ${state}. ${
        outcomeSummary || ''
      }`
    );
  });
