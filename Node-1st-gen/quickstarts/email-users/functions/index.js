/**
 * Copyright 2015 Google Inc. All Rights Reserved.
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
'use strict';

const functions = require('firebase-functions/v1');
const {onInit} = require('firebase-functions/v1');
const {defineSecret} = require('firebase-functions/params');
const {Resend} = require('resend');

// Emails are sent with Resend (https://resend.com/).
// TODO: Store your Resend API key in the `EMAIL_API_KEY` secret with `firebase functions:secrets:set EMAIL_API_KEY`.
const emailApiKey = defineSecret('EMAIL_API_KEY');

let resend;
onInit(() => {
  resend = new Resend(emailApiKey.value());
});

// Your company name to include in the emails
// TODO: Change this to your app or company name to customize the email sent.
const APP_NAME = 'Cloud Storage for Firebase quickstart';

// [START sendWelcomeEmail]
/**
 * Sends a welcome email to new user.
 */
// [START onCreateTrigger]
exports.sendWelcomeEmail = functions.runWith({secrets: [emailApiKey]}).auth.user().onCreate((user) => {
// [END onCreateTrigger]
  // [START eventAttributes]
  const email = user.email; // The email of the user.
  const displayName = user.displayName; // The display name of the user.
  // [END eventAttributes]

  return sendWelcomeEmail(email, displayName);
});
// [END sendWelcomeEmail]

// [START sendByeEmail]
/**
 * Send an account deleted email confirmation to users who delete their accounts.
 */
// [START onDeleteTrigger]
exports.sendByeEmail = functions.runWith({secrets: [emailApiKey]}).auth.user().onDelete((user) => {
// [END onDeleteTrigger]
  const email = user.email;
  const displayName = user.displayName;

  return sendGoodbyeEmail(email, displayName);
});
// [END sendByeEmail]

// Sends a welcome email to the given user.
async function sendWelcomeEmail(email, displayName) {
  // Resend reports API failures in the returned `error` instead of throwing.
  const {error} = await resend.emails.send({
    from: `${APP_NAME} <onboarding@resend.dev>`,
    to: email,
    subject: `Welcome to ${APP_NAME}!`,
    text: `Hey ${displayName || ''}! Welcome to ${APP_NAME}. I hope you will enjoy our service.`,
  });
  if (error) {
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
  functions.logger.log('New welcome email sent to:', email);
  return null;
}

// Sends a goodbye email to the given user.
async function sendGoodbyeEmail(email, displayName) {
  const {error} = await resend.emails.send({
    from: `${APP_NAME} <onboarding@resend.dev>`,
    to: email,
    subject: `Bye!`,
    text: `Hey ${displayName || ''}!, We confirm that we have deleted your ${APP_NAME} account.`,
  });
  if (error) {
    throw new Error(`Failed to send goodbye email: ${error.message}`);
  }
  functions.logger.log('Account deletion confirmation email sent to:', email);
  return null;
}
