/**
 * Copyright 2018 The Cloud Functions for Firebase Sample Library Authors All Rights Reserved
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

const functions = require('firebase-functions');
const rp = require('request-promise');

// Asynchronously retrieve the list of available priorities from Redmine
function getIssuePriorities() {
  const server_url = functions.config().redmine.server_url;
  const api_key = functions.config().redmine.api_key;
  const url = `${server_url}/enumerations/issue_priorities.json?key=${api_key}`;

  console.log(`Running GET on ${url}`);
  return rp({
    method: 'GET',
    uri: url,
    json: true,
  });
}

// Helper function that calculates the priority of the issue
async function calculateIssuePriority(eventType) {
    // Get list of available issue priorities
    const result = await getIssuePriorities();

    // Map the Redmine priority label from the event type
    let priorityName;
    if (eventType === 'velocityAlert') {
      priorityName = 'Urgent';
    } else if (eventType === 'regressed') {
      priorityName = 'High';
    } else {
      priorityName = 'Normal';
    }
    console.log(`Event type is ${eventType} => ${priorityName}; try to get the best priority from: ${result.issue_priorities}`);

    // Search for the target priority
    for (let i = 0; i < result.issue_priorities.length; i++) {
      if (result.issue_priorities[i].name == priorityName) {
        return result.issue_priorities[i].id;
      }
    }

    // Not found? Use Redmine's default priority
    for (let i = 0; i < result.issue_priorities.length; i++) {
      if (result.issue_priorities[i].is_default === true) {
        return result.issue_priorities[i].id;
      }
    }

    // Last resort -- but likely to fail anyway
    return result.issue_priorities[0].id;
}

// Asynchronously create a Redmine issue with the specific summary, description and priority
function createRedmineIssue(summary, description, priority) {
  const server_url = functions.config().redmine.server_url;
  const api_key = functions.config().redmine.api_key;
  const issue_type = functions.config().redmine.issue_type;
  const project_id = functions.config().redmine.project_id;

  const url = `${server_url}/issues.json?key=${api_key}`;

  const newIssue = {
    issue: {
      project_id: project_id,
      tracker_id: issue_type,
      priority_id: priority,
      subject: summary,
      description: description,
    },
  };

  console.log(`POSTing to ${url}, issue is:`);
  console.log(newIssue);

  return rp({
    method: 'POST',
    uri: url,
    body: newIssue,
    headers: {
      'Content-Type': 'application/json',
    },
    json: true,
  });
}

exports.sendOnNewIssue = functions.crashlytics.issue().onNew(async (issue) => {
  const issueId = issue.issueId;
  const issueTitle = issue.issueTitle;
  const appName = issue.appInfo.appName;
  const appId = issue.appInfo.appId;
  const appPlatform = issue.appInfo.appPlatform;
  const latestAppVersion = issue.appInfo.latestAppVersion;

  console.log(`Received issue:`);
  console.log(issue);

  const summary = `[Firebase] New Issue ${issueId} in ${appName} on ${appPlatform}`;
  const description = `There is a new issue - ${issueTitle} in ${appId}, version ${latestAppVersion}`;
  const priority = await calculateIssuePriority();
  await createRedmineIssue(summary, description, priority);
  console.log(`Created issue ${issueId} in Redmine successfully`);
});

