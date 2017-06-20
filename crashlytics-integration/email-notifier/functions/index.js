/**
 * Copyright 2016 Google Inc. All Rights Reserved.
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

const functions = require('firebase-functions'),
      nodemailer = require('nodemailer');

// To use a service account auth instead of the basic user/pass
// see https://developers.google.com/identity/protocols/OAuth2ServiceAccount
// const serviceKeys = require('./service-account.json');

// @todo: specify an email address to receive the notifications
const USER_EMAIL = "";

exports.sendMailOnIssue = functions.crashlytics.onNewIssue((event) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: functions.config().email.user,
      pass: functions.config().email.pass
    }
  });

  // sample for using service account
  // const transporter = nodemailer.createTransport({
  //   service: 'Gmail',
  //   auth: {
  //     type: 'OAuth2,
  //     user: functions.config().email.user,
  //     serviceClient: serviceKeys.client_email,
  //     privateKey: serviceKeys.privateKey,
  //   }
  // });

  const { data } = event;
  const mailOpts = {
    from: functions.config().email.user,
    to: USER_EMAIL,
    subject: 'Your app has a new issue',
    html: `<h1>Heads up, your app has a new issue!</h1>
        <p>Issue Id: ${data.issueId}</p>
        <p>Issue Title: ${data.issueTitle}</p>`
  };

  transporter.sendMail(mailOpts, (err) => {
    if (err) {
      console.log("Error has occured", err);
    } else {
      console.log("Successfully sent mail");
    }
  });
});