/**
 * Copyright 2022 Google Inc. All Rights Reserved.
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

// [START all]
// [START import]
// The Cloud Functions for Firebase SDK to create v2 Cloud Functions and set up triggers.
const { onTestMatrixCompleted } = require('firebase-functions/v2/testLab');
const { logger, config } = require('firebase-functions');
// The Axios client to send web requests to Slack.
const axios = require('axios');
// [END import]

// [START postToSlack]
function postToSlack(title, details) {
  return axios.post(
    config().slack.webhook_url,
    {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: title
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: details
          }
        }
      ]
    }
  );
}
// [END postToSlack]

// [START getSlackmoji]
function getSlackmoji(term) {
  switch (term) {
    case 'SUCCESS':
      return ':tada:';
    case 'FAILURE':
      return ':broken_heart:';
    case 'INCONCLUSIVE':
      return ':question:';
    case 'SKIPPED':
      return ':arrow_heading_down:';
    case 'VALIDATING':
      return ':thought_balloon:';
    case 'PENDING':
      return ':soon:';
    case 'FINISHED':
      return ':white_check_mark:';
    case 'ERROR':
      return ':red_circle:';
    case 'INVALID':
      return ':large_orange_diamond:';
    default:
      return '';
  }
}
// [END getSlackmoji]

// [START posttestresultstoslack]
exports.posttestresultstoslack = onTestMatrixCompleted(async (event) => {
  // Obtain Test Matrix properties from the CloudEvent
  const { testMatrixId, state, outcomeSummary } = event.data;

  // Create the title of the message
  const title = `${getSlackmoji(state)} ${getSlackmoji(
    outcomeSummary
  )} ${testMatrixId}`;
  
  // Create the details of the message
  const details = `Status: *${state}* ${getSlackmoji(
    state
  )}\nOutcome: *${outcomeSummary}* ${getSlackmoji(outcomeSummary)}
  `;

  // Post the message to slack
  const slackResponse = await postToSlack(title, details);
  
  // Log the response
  logger.log(JSON.stringify(slackResponse.data));
});
// [END posttestresultstoslack]
// [END all]
