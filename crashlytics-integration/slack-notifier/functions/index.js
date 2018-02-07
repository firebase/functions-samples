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

exports.postOnNewIssue = functions.crashlytics.issue().onNewDetected(event => {
  const data = event.data;

  const issueId = data.issueId;
  const issueTitle = data.issueTitle;
  const appName = data.appInfo.appName;
  const appPlatform = data.appInfo.appPlatform;
  const latestAppVersion = data.appInfo.latestAppVersion;

  const slackMessage = `<!here|here> There is a new issue - ${issueTitle} (${issueId}) ` +
      `in ${appName}, version ${latestAppVersion} on ${appPlatform}`;

  return notifySlack(slackMessage).then(() => {
    return console.log(`Posted new issue ${issueId} successfully to Slack`);
  });
});

exports.postOnRegressedIssue = functions.crashlytics.issue().onRegressed(event => {
  const data = event.data;

  const issueId = data.issueId;
  const issueTitle = data.issueTitle;
  const appName = data.appInfo.appName;
  const appPlatform = data.appInfo.appPlatform;
  const latestAppVersion = data.appInfo.latestAppVersion;
  const resolvedTime = data.resolvedTime;

  const slackMessage = `<!here|here> There is a regressed issue ${issueTitle} (${issueId}) ` +
      `in ${appName}, version ${latestAppVersion} on ${appPlatform}. This issue was previously ` +
      `resolved at ${new Date(resolvedTime).toString()}`;

  return notifySlack(slackMessage).then(() => {
    return console.log(`Posted regressed issue ${issueId} successfully to Slack`);
  });
});

exports.postOnVelocityAlert = functions.crashlytics.issue().onVelocityAlert(event => {
  const data = event.data;

  const issueId = data.issueId;
  const issueTitle = data.issueTitle;
  const appName = data.appInfo.appName;
  const appPlatform = data.appInfo.appPlatform;
  const latestAppVersion = data.appInfo.latestAppVersion;
  const crashPercentage = data.velocityAlert.crashPercentage;

  const slackMessage = `<!here|here> There is an issue ${issueTitle} (${issueId}) ` +
      `in ${appName}, version ${latestAppVersion} on ${appPlatform} that is causing ` +
      `${parseFloat(crashPercentage).toFixed(2)}% of all sessions to crash.`;

  return notifySlack(slackMessage)/then(() => {
    console.log(`Posted velocity alert ${issueId} successfully to Slack`);
  });
});
