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

// Sends an email confirmation when a user changes his mailing list subscription.
exports.sendEmailConfirmation = functions.runWith({secrets: [emailApiKey]}).database.ref('/users/{uid}').onWrite(async (change) => {
  // Early exit if the 'subscribedToMailingList' field has not changed
  if (change.after.child('subscribedToMailingList').val() === change.before.child('subscribedToMailingList').val()) {
    return null;
  }

  const val = change.after.val();
  const subscribed = val.subscribedToMailingList;

  // Building Email message.
  const mailOptions = {
    from: 'Spammy Corp. <onboarding@resend.dev>',
    to: val.email,
    subject: subscribed ? 'Thanks and Welcome!' : 'Sad to see you go :`(',
    text: subscribed ?
        'Thanks you for subscribing to our newsletter. You will receive our next weekly newsletter.' :
        'I hereby confirm that I will stop sending you the newsletter.',
  };

  // Resend reports API failures in the returned `error` instead of throwing.
  const {error} = await resend.emails.send(mailOptions);
  if (error) {
    functions.logger.error(
      'There was an error while sending the email:',
      error
    );
    return null;
  }
  functions.logger.log(
    `New ${subscribed ? '' : 'un'}subscription confirmation email sent to:`,
    val.email
  );
  return null;
});
