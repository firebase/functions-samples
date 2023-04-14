const functions = require('firebase-functions');

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
    headers: {"Content-Type": "application/json"},
  });
  return response.json();
}

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

exports.postTestResultsToSlack = functions.testLab
  .testMatrix()
  .onComplete(async testMatrix => {
    const { testMatrixId, state, outcomeSummary } = testMatrix;

    const title = `${getSlackmoji(state)} ${getSlackmoji(
      outcomeSummary
    )} ${testMatrixId}`;

    const details = `Status: *${state}* ${getSlackmoji(
      state
    )}\nOutcome: *${outcomeSummary}* ${getSlackmoji(outcomeSummary)}
    `;

    const slackResponse = await postToSlack(title, details);

    functions.logger.log(slackResponse);
  });
