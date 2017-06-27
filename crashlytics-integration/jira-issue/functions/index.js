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

// Helper function that calculate the priority of the issue
const calculateIssuePriority = (issueTitle) => {
  // run some custom logic that can determine the priority or severity of this issue
  // for example, you can parse the stack trace to determine which part of your app
  // is causing the crash and assign priorities based on that

  // see https://docs.atlassian.com/jira/REST/cloud/#api/2/priority
  // to grab a list of priorities that's available for your project
  // for a default project, priorities are:
  // [{"name":"Highest","id":"1"},{"name": "High","id": "2"},{"name": "Medium","id": "3"},{"name": "Low","id": "4"},{"name": "Lowest","id": "5"}]

  // for the demonstration of this sample, just return 1
  return 1;

};

// Helper function that parses the Jira project url and returns an object
// of the url fragments
const parseUrl = (url) => {
  // input url format: https://yourdomain.atlassian.net/projects/XX
  const matches = url.match(/(https?:\/\/)(.+?)(\/.+)?\/(projects|browse)\/([\w\-]+)/);
  if (matches && matches.length === 6) {
    return { protocol: matches[1], domain: matches[2], contextPath: matches[3] || '', projectKey: matches[5]}
  } else {
    throw new Error('Unexpected URL Format');
  }
};

// Helper function that posts to Jira to create a new issue
const createJiraIssue = (issueId, issueTitle) => {
  const { project_url, user, pass, issue_type, component_id } = functions.config().jira;
  const { protocol, domain, contextPath, projectKey} = parseUrl(project_url);
  const baseUrl = [protocol, domain, contextPath].join('');
  const url = `${baseUrl}/rest/api/2/issue`;

  // see https://developer.atlassian.com/jiradev/jira-apis/jira-rest-apis/jira-rest-api-tutorials/jira-rest-api-example-create-issue
  // to customize the new issue being created
  const newIssue = {
    "fields": {
      "components": [{ "id": component_id || '10000' }],
      "project": { "key": projectKey },
      "summary": `New Issue - ${issueId}`,
      "description": issueTitle,
      "issuetype": {
        "name": issue_type || 'Bug'
      },
      "priority": {
        "id": calculateIssuePriority(issueTitle).toString()
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

exports.createJiraOnIssue = functions.crashlytics.onNewIssue((event) => {
  const { data } = event;
  return createJiraIssue(data.issueId, data.issueTitle).then(() => {
    console.log(`Created issue ${data.issueId} successfully to Jira`);
  }).catch(error => {
    console.error('An error has occurred', error);
  });
});