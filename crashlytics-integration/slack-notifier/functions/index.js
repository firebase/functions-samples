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
const rp = require('request-promise');

// Helper function that posts to Slack about the new issue
function notifySlack(slackMessage) {
  // See https://api.slack.com/docs/message-formatting on how
  // to customize the message payload
  return rp({
    method: 'POST',
    uri: functions.config().slack.webhook_url,
    body: {
      text: slackMessage,
    },
    json: true,
  });
}

// [START on_new_issue]
exports.postOnNewIssue = functions.crashlytics.issue().onNew(async (issue) => {
  const issueId = issue.issueId;
  const issueTitle = issue.issueTitle;
  const appName = issue.appInfo.appName;
  const appPlatform = issue.appInfo.appPlatform;
  const latestAppVersion = issue.appInfo.latestAppVersion;

  const slackMessage = `<!here|here> There is a new issue - ${issueTitle} (${issueId}) ` +
      `in ${appName}, version ${latestAppVersion} on ${appPlatform}`;

  await notifySlack(slackMessage);
  console.log(`Posted new issue ${issueId} successfully to Slack`);
});
// [END on_new_issue]

exports.postOnRegressedIssue = functions.crashlytics.issue().onRegressed(async (issue) => {
  const issueId = issue.issueId;
  const issueTitle = issue.issueTitle;
  const appName = issue.appInfo.appName;
  const appPlatform = issue.appInfo.appPlatform;
  const latestAppVersion = issue.appInfo.latestAppVersion;
  const resolvedTime = issue.resolvedTime;

  const slackMessage = `<!here|here> There is a regressed issue ${issueTitle} (${issueId}) ` +
      `in ${appName}, version ${latestAppVersion} on ${appPlatform}. This issue was previously ` +
      `resolved at ${new Date(resolvedTime).toString()}`;

  await notifySlack(slackMessage);
  console.log(`Posted regressed issue ${issueId} successfully to Slack`);
});

exports.postOnVelocityAlert = functions.crashlytics.issue().onVelocityAlert(async (issue) => {
  const issueId = issue.issueId;
  const issueTitle = issue.issueTitle;
  const appName = issue.appInfo.appName;
  const appPlatform = issue.appInfo.appPlatform;
  const latestAppVersion = issue.appInfo.latestAppVersion;
  const crashPercentage = issue.velocityAlert.crashPercentage;

  const slackMessage = `<!here|here> There is an issue ${issueTitle} (${issueId}) ` +
      `in ${appName}, version ${latestAppVersion} on ${appPlatform} that is causing ` +
      `${crashPercentage.toFixed(2)}% of all sessions to crash.`;

  await notifySlack(slackMessage);
  console.log(`Posted velocity alert ${issueId} successfully to Slack`);
});
