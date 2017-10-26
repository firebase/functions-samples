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
      rp = require('request-promise');

// Helper function that posts to Slack about the new issue
const notifySlack = slackMessage => {
  // See https://api.slack.com/docs/message-formatting on how
  // to customize the message payload
  return rp({
    method: 'POST',
    uri: functions.config().slack.webhook_url,
    body: {
      text: slackMessage,
    },
    json: true
  });
};

exports.postOnNewIssue = functions.crashlytics.onNewIssue(event => {
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

  const slackMessage = `<!here|here> There's a new issue (${issueId}) ` +
      `in your app - ${opts.issueTitle}`;
  return notifySlack(slackMessage).then(() => {
    console.log(`Posted new issue ${issueId} successfully to Slack`);
  });
});

exports.postOnRegressedIssue = functions.crashlytics.onRegressedIssue(event => {
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

  const slackMessage = `<!here|here> There's a regressed issue (${issueId}) ` +
      `in your app - ${issueTitle}. This issue was previously resolved ` +
      `at ${new Date(resolvedAt).toString()}`;
  return notifySlack(slackMessage).then(() => {
    console.log(`Posted regressed issue ${issueId} successfully to Slack`);
  });
});

exports.postOnVelocityAlert = functions.crashlytics.onVelocityAlert(event => {
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

  const slackMessage = `<!here|here> There's an issue (${issueId}) on ` +
      `version ${buildVersion} that is causing ` +
      `${parseFloat(crashPercentage).toFixed(2)}% of all sessions to crash.`;
  return notifySlack(slackMessage)/then(() => {
    console.log(`Posted velocity alert ${issueId} successfully to Slack`);
  });
});