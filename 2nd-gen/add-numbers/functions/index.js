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

const { onCall, HttpsError } = require("firebase-functions/v2/https");

// [START allAdd]
// [START addFunctionTrigger]
// Adds two numbers to each other.
exports.addnumbers = onCall((data) => {
// [END addFunctionTrigger]
    // [START readAddData]
    // Numbers passed from the client.
    const firstNumber = data.firstNumber;
    const secondNumber = data.secondNumber;
    // [END readAddData]


    // [START addHttpsError]
    // Checking that attributes are present and are numbers.
    if (!Number.isFinite(firstNumber) || !Number.isFinite(secondNumber)) {
        // Throwing an HttpsError so that the client gets the error details.
        throw new HttpsError("invalid-argument", "The function must be called " +
            "with two arguments \"firstNumber\" and \"secondNumber\" which " +
            "must both be numbers.");
    }
    // [END addHttpsError]

    // [START returnAddData]
    // returning result.
    return {
        firstNumber: firstNumber,
        secondNumber: secondNumber,
        operator: "+",
        operationResult: firstNumber + secondNumber,
    };
    // [END returnAddData]
});
// [END allAdd]

