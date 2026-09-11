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

// [START myEmailService]
const { logger } = require("firebase-functions");
const { defineSecret } = require("firebase-functions/params");
const { Resend } = require("resend");

const emailApiKey = defineSecret("EMAIL_API_KEY");

/**
 * Sends an email using the Resend API.
 * @param {Object} options Email sending options.
 * @param {string} options.to Recipient email address.
 * @param {string} options.subject Email subject line.
 * @param {string} options.text Plaintext email body.
 * @return {Promise<void>}
 */
async function sendEmail({ to, subject, text }) {
  if (!to) {
    throw new Error("Missing email address.");
  }
  const resend = new Resend(emailApiKey.value());
  await resend.emails.send({
    from: "My Firebase demo <onboarding@resend.dev>",
    to,
    subject,
    text,
  });
}

/**
 * Sends a welcome email to a new user.
 * @param {string} email User email address.
 * @param {string} [displayName] User display name.
 * @param {string} [tenantId] Optional tenant ID to customize the tone.
 * @return {Promise<void>}
 */
async function sendWelcomeEmail(email, displayName, tenantId) {
  if (!email) {
    return;
  }
  const greeting = tenantId ? `Hello member of ${tenantId}` : "Hey";
  const name = displayName ? ` ${displayName}` : "";
  await sendEmail({
    to: email,
    subject: "Welcome!",
    text: `${greeting}${name}, welcome!`,
  });
  logger.log("New welcome email sent to:", email);
}

/**
 * Sends an account deletion confirmation email to a user.
 * @param {string} email User email address.
 * @param {string} [displayName] User display name.
 * @param {string} [tenantId] Optional tenant ID to customize the tone.
 * @return {Promise<void>}
 */
async function sendGoodbyeEmail(email, displayName, tenantId) {
  if (!email) {
    return;
  }
  const greeting = tenantId ? `Goodbye member of ${tenantId}` : "Bye";
  const name = displayName ? ` ${displayName}` : "";
  await sendEmail({
    to: email,
    subject: "Bye!",
    text: `${greeting}${name}! We confirm that we have deleted your My Firebase demo account.`,
  });
  logger.log("Account deletion confirmation email sent to:", email);
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendGoodbyeEmail,
};
// [END myEmailService]
