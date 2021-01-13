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

const functions = require('firebase-functions');
const sendgridMail = require('@sendgrid/mail');

// Authentication for the SendGrid account
sendgridMail.setApiKey(functions.config().sendgrid.api_key);

// [START on_new_issue]
exports.sendOnNewIssue = functions.crashlytics.issue().onNew(async (issue) => {
  // [START_EXCLUDE]
  const issueId = issue.issueId;
  const issueTitle = issue.issueTitle;
  const appName = issue.appInfo.appName;
  const appId = issue.appInfo.appId;
  const appPlatform = issue.appInfo.appPlatform;
  const latestAppVersion = issue.appInfo.latestAppVersion;
  const createTime = issue.createTime;

  const emailDetails = {
    to: functions.config().email.destination_email,
    from: functions.config().email.from_email,
    subject: `${appName} on ${appPlatform} has a new issue`,
    html: `<h2>${appName} on ${appPlatform} has a new issue!</h2>
        <p>App Name: ${appName}</p>
        <p>App Id: ${appId}</p>
        <p>Platform: ${appPlatform}</p>
        <p>Version: ${latestAppVersion}</p>
        <p>Issue Id: ${issueId}</p>
        <p>Issue Title: ${issueTitle}</p>
        <p>Creation Time: ${createTime}</p>`,
  };

  try {
    await sendgridMail.send(emailDetails);
    console.log('Successfully sent new issue email');
  } catch (error) {
    console.error(error.toString());
  }
  // [END_EXCLUDE]
});
// [END on_new_issue]

// [START on_regressed_issue]
exports.sendOnRegressedIssue = functions.crashlytics.issue().onRegressed(async (issue) => {
  // [START_EXCLUDE]
  const issueId = issue.issueId;
  const issueTitle = issue.issueTitle;
  const appName = issue.appInfo.appName;
  const appId = issue.appInfo.appId;
  const appPlatform = issue.appInfo.appPlatform;
  const latestAppVersion = issue.appInfo.latestAppVersion;
  const createTime = issue.createTime;
  const resolvedTime = issue.resolvedTime;

  const emailDetails = {
    to: functions.config().email.destination_email,
    from: functions.config().email.from_email,
    subject: `${appName} on ${appPlatform} has a regressed issue`,
    html: `<h2>${appName} on ${appPlatform} has a regressed issue!</h2>
        <p>App Name: ${appName}</p>
        <p>App Id: ${appId}</p>
        <p>Platform: ${appPlatform}</p>
        <p>Version: ${latestAppVersion}</p>
        <p>Issue Id: ${issueId}</p>
        <p>Issue Title: ${issueTitle}</p>
        <p>Creation Time: ${createTime}</p>
        <p>Originally Resolved On: ${new Date(resolvedTime).toString()}</p>`,
  };

  try {
    await sendgridMail.send(emailDetails);
    console.log('Successfully sent regressed issue email');
  } catch(error) {
    console.error(error.toString());
  }
  // [END_EXCLUDE]
});
// [END on_regressed_issue]

// [START on_velocity_alert]
exports.sendOnVelocityAlert = functions.crashlytics.issue().onVelocityAlert(async (issue) => {
  // [START_EXCLUDE]
  const issueId = issue.issueId;
  const issueTitle = issue.issueTitle;
  const appName = issue.appInfo.appName;
  const appId = issue.appInfo.appId;
  const appPlatform = issue.appInfo.appPlatform;
  const latestAppVersion = issue.appInfo.latestAppVersion;
  const createTime = issue.createTime;
  const crashPercentage = issue.velocityAlert.crashPercentage;
  const crashes = issue.velocityAlert.crashes;

  const emailDetails = {
    to: functions.config().email.destination_email,
    from: functions.config().email.from_email,
    subject: `${appName} on ${appPlatform} has a velocity alert!`,
    html: `<h2>${appName} on ${appPlatform} has a velocity alert!</h2>
        <h3>This issue is causing ${crashPercentage.toFixed(2)}% of all sessions to crash</h3>
        <p>App Name: ${appName}</p>
        <p>App Id: ${appId}</p>
        <p>Platform: ${appPlatform}</p>
        <p>Version: ${latestAppVersion}</p>
        <p>Issue Id: ${issueId}</p>
        <p>Issue Title: ${issueTitle}</p>
        <p>Creation Time: ${createTime}</p>
        <p># of Total Crashes: ${crashes.toString()}</p>`,
  };

  try {
    await sendgridMail.send(emailDetails);
    console.log('Successfully sent velocity alert email');
  } catch(error) {
    console.error(error.toString());
  }
  // [END_EXCLUDE]
});
// [END on_velocity_alert]
