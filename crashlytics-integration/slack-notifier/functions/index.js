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
const notifySlack = (issueId, issueDesc) => {
  // see https://api.slack.com/docs/message-formatting on how
  // to customize the message payload
  const slackMessage = {
    text: `<!here|here> There's a new issue (${issueId}) in your app - ${issueDesc}`
  };
  return rp({
    method: 'POST',
    uri: functions.config().slack.webhook_url,
    body: slackMessage,
    json: true
  });
};

exports.postSlackOnIssue = functions.crashlytics.onNewIssue((event) => {
  const { data } = event;
  return notifySlack(data.issueId, data.issueTitle).then(() => {
    console.log(`Posted issue ${data.issueId} successfully to Slack`);
  }).catch(error => {
    console.error('An error has occurred', error);
  });
});