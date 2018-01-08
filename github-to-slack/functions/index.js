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

const functions = require('firebase-functions');
const rp = require('request-promise');
const crypto = require('crypto');
const secureCompare = require('secure-compare');

/**
* Webhook that will be called each time there is a new GitHub commit and will post a message to
* Slack.
*/
exports.githubWebhook = functions.https.onRequest((req, res) => {
  const cipher = 'sha1';
  const signature = req.headers['x-hub-signature'];

  // TODO: Configure the `github.secret` Google Cloud environment variables.
  const hmac = crypto.createHmac(cipher, functions.config().github.secret)
    .update(req.body)
    .digest('hex');
  const expectedSignature = `${cipher}=${hmac}`;

  // Check that the body of the request has been signed with the GitHub Secret.
  if (!secureCompare(signature, expectedSignature)) {
    console.error('x-hub-signature', signature, 'did not match', expectedSignature);
    return res.status(403).send('Your x-hub-signature\'s bad and you should feel bad!');
  }
  return postToSlack(req.body.compare, req.body.commits.length, req.body.repository).then(() => {
    return res.end();
  }).catch(error => {
    console.error(error);
    return res.status(500).send('Something went wrong while posting the message to Slack.');
  });
});

/**
* Post a message to Slack about the new GitHub commit.
*/
function postToSlack(url, commits, repo) {
  return rp({
    method: 'POST',
    // TODO: Configure the `slack.webhook_url` Google Cloud environment variables.
    uri: functions.config().slack.webhook_url,
    body: {
      text: `<${url}|${commits} new commit${commits > 1 ? 's' : ''}> pushed to <${repo.url}|${repo.full_name}>.`
    },
    json: true
  });
}
