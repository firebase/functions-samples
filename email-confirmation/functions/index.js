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

const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

// Sends an email confirmation when a user changes his mailing list subscription.
exports.sendEmailConfirmation = functions.database().path('/users/{uid}').onWrite(event => {

  // Configure the email transport using the default SMTP transport and a GMail account.
  // See: https://nodemailer.com/
  // For other types of transports (Amazon SES, Sendgrid...) see https://nodemailer.com/2-0-0-beta/setup-transporter/
  // TODO: Make sure you configure the `gmail.email` and `gmail.password` Google Cloud environment variables.
  const mailTransport = nodemailer.createTransport(
      `smtps://${encodeURIComponent(functions.env.gmail.email)}:${encodeURIComponent(functions.env.gmail.password)}@smtp.gmail.com`);

  const data = event.data;
  const val = data.val();

  if (!data.changed('subscribedToMailingList')) {
    return;
  }

  const mailOptions = {
    from: '"Spammy Corp." <noreply@firebase.com>',
    to: val.email
  };

  // The user just subscribed to our newsletter.
  if (val.subscribedToMailingList) {
    mailOptions.subject = 'Thanks and Welcome!';
    mailOptions.text = 'Thanks you for subscribing to uour newsletter. You will receive our next weekly newsletter.';
    return mailTransport.sendMail(mailOptions).then(() => {
      console.log('New subscription confirmation email sent to:', val.email);
    });
  }

  // The user unsubscribed to the newsletter.
  mailOptions.subject = 'Sad to see you go :`(';
  mailOptions.text = 'I hereby confirm that I will stop sending you the newsletter.';
  return mailTransport.sendMail(mailOptions).then(() => {
    console.log('New unsubscription confirmation email sent to:', val.email);
  });
});
