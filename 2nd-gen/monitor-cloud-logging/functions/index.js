/**
 * Copyright 2023 Google LLC
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

const {onRequest} = require("firebase-functions/v2/https");
const {
  onRegressionAlertPublished,
} = require("firebase-functions/v2/alerts/crashlytics");

// [START loggerImport]
// All available logging functions
const {
  log,
  info,
  debug,
  warn,
  error,
  write,
} = require("firebase-functions/logger");
// [END loggerImport]

const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
// Initialize admin sdk for Firestore read in getInspirationalQuote
initializeApp();

// [START helloLogs]
exports.helloWorld = onRequest((request, response) => {
  // sends a log to Cloud Logging
  log("Hello logs!");

  response.send("Hello from Firebase!");
});
// [END helloLogs]

// [START logsKitchenSink]
exports.getInspirationalQuote = onRequest(async (request, response) => {
  const db = getFirestore();
  const today = new Date();
  const quoteOfTheMonthRef = db
      .collection("quotes")
      .doc(today.getFullYear())
      .collection("months")
      .doc(today.getMonth());

  const DEFAULT_QUOTE =
      "You miss 100% of the shots you don't take. -Wayne Gretzky";
  let quote;
  try {
    const quoteOfTheMonthDocSnap = await quoteOfTheMonthRef.get();

    // Attach relevant debugging information with debug()
    debug("Monthly quote fetch result", {
      docRef: quoteOfTheMonthRef.path,
      exists: quoteOfTheMonthDocSnap.exists,
      createTime: quoteOfTheMonthDocSnap.createTime,
    });

    if (quoteOfTheMonthDocSnap.exists) {
      quote = quoteOfTheMonthDocSnap.data().text;
    } else {
      // Use warn() for lower-severity issues than error()
      warn("Quote not found for month, sending default instead", {
        docRef: quoteOfTheMonthRef.path,
        dateRequested: today.toLocaleDateString("en-US"),
      });

      quote = DEFAULT_QUOTE;
    }
  } catch (e) {
    // Attach stack trace to errors
    error("Unable to read quote from Firestore, sending default instead",
        {message: e.stack});

    quote = DEFAULT_QUOTE;
  }

  // Attach relevant structured data to any log
  info("Sending a quote!", {quote: quote});
  response.json({inspirationalQuote: quote});
});
// [END logsKitchenSink]

// [START customLogWrite]
exports.appHasARegression = onRegressionAlertPublished((event) => {
  write({
    // write() lets you set additional severity levels
    // beyond the built-in logger functions
    severity: "EMERGENCY",
    message: "Regression in production app",
    issue: event.data.payload.issue,
    lastOccurred: event.data.payload.resolveTime,
  });
});
// [END customLogWrite]
