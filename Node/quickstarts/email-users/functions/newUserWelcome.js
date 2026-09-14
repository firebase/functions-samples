/**
 * Copyright 2026 Google LLC
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
"use strict";

// [START sendWelcomeEmail]
// [START onCreateImport]
const { onUserCreated } = require("firebase-functions/identity");
// [END onCreateImport]
const { defineSecret } = require("firebase-functions/params");
const { logger } = require("firebase-functions");
const { sendWelcomeEmail } = require("./utils/myEmailService");

const emailApiKey = defineSecret("EMAIL_API_KEY");

// [START onCreateTrigger]
exports.newUserWelcome = onUserCreated(
  { secrets: [emailApiKey] },
  async (event) => {
    // [END onCreateTrigger]
    // [START eventAttributes]
    const { uid, email, displayName } = event.data;
    // [END eventAttributes]

    if (!email) {
      logger.log(`User ${uid} does not have an email address.`);
      return;
    }

    await sendWelcomeEmail(email, displayName);
  },
);
// [END sendWelcomeEmail]
