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
// Configure the email transport using the default SMTP transport and a GMail account.
// See: https://nodemailer.com/
// For other types of transports (Amazon SES, Sendgrid...) see https://nodemailer.com/2-0-0-beta/setup-transporter/
// TODO: Make sure you configure the `gmail.email` and `gmail.password` Google Cloud environment variables.
const gmailEmail = encodeURIComponent(functions.config().gmail.email);
const gmailPassword = encodeURIComponent(functions.config().gmail.password);
const mailTransport = nodemailer.createTransport(
    `smtps://${gmailEmail}:${gmailPassword}@smtp.gmail.com`);

// Your company name to include in the emails
// TODO: Change this to your company name and also customize the email sent.
const COMPANY_NAME = 'MyCompany';

// Sends a welcome email to new user.
exports.sendWelcomeEmail = functions.auth.user().onCreate(event => {
  const email = event.data.email;
  const displayName = event.data.displayName;

  return sendWelcomeEmail(email, displayName);
});

// Send an account deleted email confirmation to users who delete their accounts.
exports.sendByeEmail = functions.auth.user().onDelete(event => {
  const email = event.data.email;
  const displayName = event.data.displayName;

  return sendGoodbyEmail(email, displayName);
});

// Sends a welcome email to the given user.
function sendWelcomeEmail(email, displayName) {
  const mailOptions = {
    from: '"MyCompany" <noreply@firebase.com>',
    to: email
  };

  // The user unsubscribed to the newsletter.
  mailOptions.subject = `Welcome to ${COMPANY_NAME}!`;
  mailOptions.text = `Hey ${displayName}!, Welcome to ${COMPANY_NAME}. I hope you will enjoy our service.`;
  return mailTransport.sendMail(mailOptions).then(() => {
    console.log('New welcome email sent to:', email);
  });
}

// Sends a goodbye email to the given user.
function sendGoodbyEmail(email, displayName) {
  const mailOptions = {
    from: '"MyCompany" <noreply@firebase.com>',
    to: email
  };

  // The user unsubscribed to the newsletter.
  mailOptions.subject = `Bye!`;
  mailOptions.text = `Hey ${displayName}!, We confirm that we have deleted your ${COMPANY_NAME} account.`;
  return mailTransport.sendMail(mailOptions).then(() => {
    console.log('Account deletion confirmation email sent to:', email);
  });
}
