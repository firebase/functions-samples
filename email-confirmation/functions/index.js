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

var functions = require('firebase-functions');
var nodemailer = require('nodemailer');

// Configure the email transport using the default SMTP transport and a GMail account.
// See: https://nodemailer.com/
// For other types of transports (Amazon SES, Sendgrid...) see https://nodemailer.com/2-0-0-beta/setup-transporter/
// TODO(DEVELOPER): Configure your email transport below. For GMail replace the <USER> and <PASSWORD> placeholders.
var mailTransport = nodemailer.createTransport('smtps://<USER>:<PASSWORD>@smtp.gmail.com');

// Sends an email confirmation when a user changes his mailing list subscription.
exports.sendEmailConfirmation = functions.database().path('/users/{uid}').on('value', function(event) {
  var data = event.data;
  var val = data.val();

  if (!data.changed('subscribedToMailingList')) {
    return;
  }

  var mailOptions = {
    from: '"Spammy Corp." <noreply@firebase.com>',
    to: val.email
  };

  // The user just subscribed to our newsletter.
  if (val.subscribedToMailingList) {
    mailOptions.subject = 'Thanks for subscribing to our newsletter';
    mailOptions.text = 'I will now spam you forever muahahahahah!!!';
    return mailTransport.sendMail(mailOptions).then(function() {
      console.log('New subscription confirmation email sent to: ' + val.email);
    });
  }

  // The user unsubscribed to the newsletter.
  mailOptions.subject = 'Sad to see you go :`(';
  mailOptions.text = 'I hereby confirm that I will stop the spamming.';
  return mailTransport.sendMail(mailOptions).then(function() {
    console.log('New unsubscription confirmation email sent to: ' + val.email);
  });
});
