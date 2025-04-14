/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const functions = require("firebase-functions/v1");

// The node-fetch library to send web requests to Slack.
const fetch = require("node-fetch");

/**
 * Posts a message to Slack via a Webhook
 * @param {string} title
 * @param {string} details
 * @return {Promise<string>}
 */
async function postToSlack(title, details) {
  const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: "post",
    body: JSON.stringify({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: title,
          },
        },
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: details,
          },
        },
      ],
    }),
    headers: { "Content-Type": "application/json" },
  });
  return response.json();
}

function getSlackmoji(term) {
  switch (term) {
    case "SUCCESS":
      return ":tada:";
    case "FAILURE":
      return ":broken_heart:";
    case "INCONCLUSIVE":
      return ":question:";
    case "SKIPPED":
      return ":arrow_heading_down:";
    case "VALIDATING":
      return ":thought_balloon:";
    case "PENDING":
      return ":soon:";
    case "FINISHED":
      return ":white_check_mark:";
    case "ERROR":
      return ":red_circle:";
    case "INVALID":
      return ":large_orange_diamond:";
    default:
      return "";
  }
}

exports.postTestResultsToSlack = functions.testLab
  .testMatrix()
  .onComplete(async (testMatrix) => {
    const { testMatrixId, state, outcomeSummary } = testMatrix;

    const title = `${getSlackmoji(state)} ${getSlackmoji(
      outcomeSummary,
    )} ${testMatrixId}`;

    const details = `Status: *${state}* ${getSlackmoji(
      state,
    )}\nOutcome: *${outcomeSummary}* ${getSlackmoji(outcomeSummary)}
    `;

    const slackResponse = await postToSlack(title, details);

    functions.logger.log(slackResponse);
  });
