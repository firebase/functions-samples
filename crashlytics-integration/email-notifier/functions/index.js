/**
 * Copyright 2017 Google Inc. All Rights Reserved.
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
      sendgridMail = require('@sendgrid/mail');

// Authentication for the SendGrid account
sendgridMail.setApiKey(functions.config().sendgrid.api_key);

exports.sendOnNewIssue = functions.crashlytics.onNewIssue(event => {
  const data = event.data;
  // Available attributes for new issues
  // data.issueid - {String} Issue id number
  // data.issuetitle - {String} Issue Title (first line of the stack trace)
  // data.appName - {String} Name of the app
  // data.bundleId - {String} Bundle Id of the app
  // data.platform - {String} Platform
  const issueId = data.issueid;
  const issueTitle = data.issuetitle;
  const appName = data.appName;
  const bundleId = data.bundleId;
  const platform = data.platform;

  const emailDetails = {
    to: functions.config().email.destination_email,
    from: functions.config().email.from_email,
    subject: `${appName} app has a new issue`,
    html: `<h2>${appName} app has a new issue!</h2>
        <p>App: ${appName}</p>
        <p>Bundle Id: ${bundleId}</p>
        <p>Platform: ${platform}</p>
        <p>Issue Id: ${issueId}</p>
        <p>Issue Title: ${issueTitle}</p>`
  };

  sendgridMail.send(emailDetails).then(() => {
    console.log('Successfully sent new issue email');
  }).catch(error => {
    console.error(error.toString());
  });
});

exports.sendOnRegressedIssue = functions.crashlytics.onRegressedIssue(event => {
  const data = event.data;
  // Available attributes for regressed issues
  // data.issueId - {String} Issue id number
  // data.issueTitle - {String} Issue Title (first line of the stack trace)
  // data.appName - {String} Name of the app
  // data.bundleId - {String} Bundle ID of the app
  // data.platform - {String} Platform
  // data.resolvedAt - {Long} Timestamp in which the issue was resolved at
  const issueId = data.issueid;
  const issueTitle = data.issuetitle;
  const appName = data.appName;
  const bundleId = data.bundleId;
  const platform = data.platform;
  const resolvedAt = data.resolvedAt;

  const emailDetails = {
    to: functions.config().email.destination_email,
    from: functions.config().email.from_email,
    subject: `${appName} app has a regressed issue`,
    html: `<h2>${appName} app has a regressed issue!</h2>
        <p>App: ${appName}</p>
        <p>Bundle Id: ${bundleId}</p>
        <p>Platform: ${platform}</p>
        <p>Issue Id: ${issueId}</p>
        <p>Issue Title: ${issueTitle}</p>
        <p>Originally Resolved On: ${new Date(resolvedAt).toString()}</p>`
  };

  return sendgridMail.send(emailDetails).then(() => {
    console.log('Successfully sent regressed issue email');
  }).catch(error => {
    console.error(error.toString());
  });
});

exports.sendOnVelocityAlert = functions.crashlytics.onVelocityAlert(event => {
  const data = event.data;
  // Available attributes for regressed issues
  // data.issueid - {String} Issue id number
  // data.issuetitle - {String} Issue Title (first line of the stack trace)
  // data.appName - {String} Name of the app
  // data.bundleId - {String} Bundle ID of the app
  // data.platform - {String} Platform
  // data.crashPercentage - {double} Crash Percentage. Total crashes divided by total # of sessions.
  // data.buildVersion - {String} build version
  // data.crashes - {double} # of Crashes
  const issueId = data.issueid;
  const issueTitle = data.issuetitle;
  const appName = data.appName;
  const bundleId = data.bundleId;
  const platform = data.platform;
  const crashPercentage = data.crashPercentage;
  const buildVersion = data.buildVersion;
  const crashes = data.crashes;

  const emailDetails = {
    to: functions.config().email.destination_email,
    from: functions.config().email.from_email,
    subject: `${appName} app has a velocity alert!`,
    html: `<h2>${appName} app has a velocity alert!</h2>
        <h3>This issue is causing ${parseFloat(crashPercentage).toFixed(2)}% of all sessions to crash</h3>
        <p>App: ${appName}</p>
        <p>Bundle Id: ${bundleId}</p>
        <p>Platform: ${platform}</p>
        <p>Issue Id: ${issueId}</p>
        <p>Issue Title: ${issueTitle}</p>
        <p>Build Version: ${buildVersion}</p>
        <p># of Total Crashes: ${crashes.toString()}</p>`
  };
  return sendgridMail.send(emailDetails).then(() => {
    console.log('Successfully sent velocity alert email');
  }).catch(error => {
    console.error(error.toString());
  });
});
