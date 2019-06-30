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

// Helper function that parses the Github project url and returns an object
// of the url fragments
function parseUrl(url) {
  // input url format: https://github.com/XX/XX
  const matches = url.match(/(https?:\/\/).+?.+?\/([\w-]+)\/([\w-]+)/);
  if (matches && matches.length === 4) {
    return {protocol: matches[1], owner: matches[2], repo: matches[3], };
  } else {
    throw new Error('Unexpected URL Format');
  }
}

// Helper function that posts to Github to create a new issue
function createGithubIssue(summary, description) {
  const repo_url = functions.config().github.repository_url;
  const user = functions.config().github.user;
  const pass = functions.config().github.pass;
  const labels = functions.config().github.labels;

  const {protocol, owner, repo } = parseUrl(repo_url);
  const url = `${protocol}api.github.com/repos/${owner}/${repo}/issues`;

  const newIssue = {
      title: summary,
      body: description,
      labels: (labels != null) ? labels.split(',') : []
  };

  // Uses Basic Authentication
  // Github Doc: https://developer.github.com/v3/#authentication
  // Request (Promise) Doc: https://github.com/request/request#http-authentication
  console.log("Making request", url);
  console.log("Body", newIssue)
  return rp({
    auth: {
      'user': user,
      'pass': pass,
    },
    method: 'POST',
    uri: url,
    body: newIssue,
    json: true,
    headers: {'user-agent': 'CrashlyticsReporting'}
  });
}

exports.createNewIssue = functions.crashlytics.issue().onNew(async (issue) => {
  console.log("New Issue", issue);
  const issueId = issue.issueId;
  const issueTitle = issue.issueTitle;
  const appName = issue.appInfo.appName;
  const appId = issue.appInfo.appId;
  const appPlatform = issue.appInfo.appPlatform;
  const latestAppVersion = issue.appInfo.latestAppVersion;

  const summary = `New Issue - ${issueId} in ${appName} on ${appPlatform}`;
  const description = `There is a new issue - ${issueTitle} in ${appId}, ` +
      `version ${latestAppVersion}.`;
  await createGithubIssue(summary, description);
  console.log(`Created issue ${issueId} in Github successfully`);
});

exports.createRegressedIssue = functions.crashlytics.issue().onRegressed(async (issue) => {
  console.log("Regressed Issue", issue);
  const issueId = issue.issueId;
  const issueTitle = issue.issueTitle;
  const appName = issue.appInfo.appName;
  const appId = issue.appInfo.appId;
  const appPlatform = issue.appInfo.appPlatform;
  const latestAppVersion = issue.appInfo.latestAppVersion;
  const resolvedTime = issue.resolvedTime;

  const summary = `Regressed Issue - ${issueId} in ${appName} on ${appPlatform}`;
  const description = `There is a regressed issue - ${issueTitle} in ${appId}, ` +
      `version ${latestAppVersion}. This issue was previously resolved at ` +
      `${new Date(resolvedTime).toString()}`;
  await createGithubIssue(summary, description);
  console.log(`Created issue ${issueId} in Github successfully`);
});

exports.createVelocityAlert = functions.crashlytics.issue().onVelocityAlert(async (issue) => {
  console.log("Velocity Alert", issue);
  const issueId = issue.issueId;
  const issueTitle = issue.issueTitle;
  const appName = issue.appInfo.appName;
  const appId = issue.appInfo.appId;
  const appPlatform = issue.appInfo.appPlatform;
  const latestAppVersion = issue.appInfo.latestAppVersion;
  const crashPercentage = issue.velocityAlert.crashPercentage;

  const summary = `Velocity Alert - ${issueId} in ${appName} on ${appPlatform}`;
  const description = `A velocity alert has been reported - ${issueTitle} in ${appId}. ` +
      `This issue is occuring in build version ${latestAppVersion} and is causing ` +
      `${parseFloat(crashPercentage).toFixed(2)}% of all sessions to crash.`;
  await createGithubIssue(summary, description);
  console.log(`Created issue ${issueId} in Github successfully`);
});
