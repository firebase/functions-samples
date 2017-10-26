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

// Helper function that calculates the priority of the issue
const calculateIssuePriority = eventType => {
  // Run custom logic that can determine the priority or severity of this issue
  // For example, you can parse the stack trace to determine which part of your app
  // is causing the crash and assign priorities based on that

  // See https://docs.atlassian.com/jira/REST/cloud/#api/2/priority
  // to grab a list of priorities that's available for your project
  // For a default project, priorities are:
  // [{"name":"Highest","id":"1"},{"name": "High","id": "2"},{"name": "Medium","id": "3"},{"name": "Low","id": "4"},{"name": "Lowest","id": "5"}]

  // For the demonstration of this sample, let's assign a priority based on the event type
  if (eventType === 'velocityAlert') {
    // high impacting, return highest priority
    return 1;
  } else if (eventType === 'regressed') {
    // regressed issue, return medium priority
    return 3;
  } else {
    // new issues - return low priority
    return 4;
  }
};

// Helper function that parses the Jira project url and returns an object
// of the url fragments
const parseUrl = url => {
  // input url format: https://yourdomain.atlassian.net/projects/XX
  const matches = url.match(/(https?:\/\/)(.+?)(\/.+)?\/(projects|browse)\/([\w\-]+)/);
  if (matches && matches.length === 6) {
    return {protocol: matches[1], domain: matches[2], contextPath: matches[3] || '', projectKey: matches[5]};
  } else {
    throw new Error('Unexpected URL Format');
  }
};

// Helper function that posts to Jira to create a new issue
const createJiraIssue = (summary, description, priority) => {
  const { project_url, user, pass, issue_type, component_id } = functions.config().jira;
  const { protocol, domain, contextPath, projectKey} = parseUrl(project_url);
  const baseUrl = [protocol, domain, contextPath].join('');
  const url = `${baseUrl}/rest/api/2/issue`;

  // See https://developer.atlassian.com/jiradev/jira-apis/jira-rest-apis/jira-rest-api-tutorials/jira-rest-api-example-create-issue
  // to customize the new issue being created
  const newIssue = {
    fields: {
      components: [{id: component_id || '10000'}],
      project: {key: projectKey },
      summary,
      description,
      issuetype: {
        name: issue_type || 'Bug'
      },
      priority: {
        id: priority.toString(),
      }
    }
  };

  // Uses Basic Authentication
  // Jira Doc: https://developer.atlassian.com/jiradev/jira-apis/jira-rest-apis/jira-rest-api-tutorials/jira-rest-api-example-basic-authentication
  // Request (Promise) Doc: https://github.com/request/request#http-authentication
  return rp({
    auth: {
      'user': user,
      'pass': pass
    },
    method: 'POST',
    uri: url,
    body: newIssue,
    json: true
  });
};

exports.createNewIssue = functions.crashlytics.onNewIssue(event => {
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

  const summary = `New Issue - ${issueId}`;
  const description = `There's a new issue in your app - ${issueTitle}`;
  const priority = calculateIssuePriority();
  return createJiraIssue(summary, description, priority).then(() => {
    console.log(`Created issue ${issueId} successfully to Jira`);
  });
});

exports.createRegressedIssue = functions.crashlytics.onRegressedIssue(event => {
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

  const summary = `Regressed Issue - ${issueId}`;
  const description = `There's a regressed issue in your app - ${issueTitle}` +
      ` This issue was previously resolved at ${new Date(resolvedAt).toString()}`;
  const priority = calculateIssuePriority('regressed');
  return createJiraIssue(summary, description, priority).then(() => {
    console.log(`Created issue ${issueId} successfully to Jira`);
  });
});

exports.createVelocityAlert = functions.crashlytics.onVelocityAlert(event => {
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

  const summary = `Velocity Alert - ${issueId}`;
  const description = `A velocity alert has been reported - ${issueTitle}. ` +
      `This issue is occuring in build version ${buildVersion} and is causing ` +
      `${parseFloat(crashPercentage).toFixed(2)}% of all sessions to crash.`;
  const priority = calculateIssuePriority('velocityAlert');
  return createJiraIssue(summary, description, priority).then(() => {
    console.log(`Created issue ${issueId} successfully to Jira`);
  });
});
