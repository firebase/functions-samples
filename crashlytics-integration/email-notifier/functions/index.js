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

// To use a service account auth instead of the lintbasic user/pass
// see https://developers.google.com/identity/protocols/OAuth2ServiceAccount
// const serviceKeys = require('./service-account.json');

// Helper function for nodemailer
const createTransporter = () => {
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

  return transporter;
};

exports.sendOnNewIssue = functions.crashlytics.onNewIssue(event => {
  const { data } = event;
  // Available attributes for new issues
  // data.issueId - {String} Issue id number
  // data.issueTitle - {String} Issue Title (first line of the stack trace)
  const { issueId, issueTitle } = data;
  const mailOpts = {
    from: functions.config().email.user,
    to: functions.config().email.destination_email,
    subject: 'Your app has a new issue',
    html: `<h1>Heads up, your app has a new issue!</h1>
        <p>Issue Id: ${issueId}</p>
        <p>Issue Title: ${issueTitle}</p>`
  };

  return createTransporter().sendMail(mailOpts).then(() => {
    console.log('Successfully sent mail');
  });
});

exports.sendOnRegressedIssue = functions.crashlytics.onRegressedIssue(event => {
  const { data } = event;
  // Available attributes for regressed issues
  // data.issueId - {String} Issue id number
  // data.issueTitle - {String} Issue Title (first line of the stack trace)
  // data.resolvedAt - {Long} Timestamp in which the issue was resolved at
  const { issueId, issueTitle, resolvedAt } = data;
  const mailOpts = {
    from: functions.config().email.user,
    to: functions.config().email.destination_email,
    subject: 'Your app has a new issue',
    html: `<h1>Heads up, your app has a regressed issue!</h1>
        <p>Issue Id: ${issueId}</p>
        <p>Issue Title: ${issueTitle}</p>
        <p>Originally Resolved On: ${new Date(resolvedAt).toString()}</p>`
  };

  return createTransporter().sendMail(mailOpts).then(() => {
    console.log('Successfully sent mail');
  });
});

exports.sendOnVelocityAlert = functions.crashlytics.onVelocityAlert(event => {
  const { data } = event;
  // Available attributes for velocity alerts
  // data.issueId - {String} Issue id number
  // data.issueTitle - {String} Issue Title (first line of the stack trace)
  // data.crashPercentage - {double} Crash Percentage. Total crashes divided by total # of sessions.
  // data.buildVersion - {String} build version
  // data.crashes - {double} # of Crashes
  const { issueId, issueTitle, crashPercentage, buildVersion, crashes } = data;
  const mailOpts = {
    from: functions.config().email.user,
    to: functions.config().email.destination_email,
    subject: 'Your app has a velocity alert!',
    html: `<h1>Heads up, your app has a velocity alert!</h1>
        <h3>This issue is causing ${parseFloat(crashPercentage).toFixed(2)}% of all sessions to crash</h3>
        <p>Issue Id: ${issueId}</p>
        <p>Issue Title: ${issueTitle}</p>
        <p>Build Version: ${buildVersion}</p>
        <p># of Total Crashes: ${crashes.toString()}</p>`,
  };

  return createTransporter().sendMail(mailOpts).then(() => {
    console.log('Successfully sent mail');
  });
});
