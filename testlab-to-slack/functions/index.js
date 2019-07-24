const functions = require('firebase-functions');

const slackAPI = 'https://slack.com/api/chat.postMessage';
const slackToken = functions.config().slack.token;
const slackChannelId = functions.config().slack.channelid;
const axios = require('axios');

function postToSlack(title, details) {
  return axios.post(
    slackAPI,
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
      ],
      channel: slackChannelId
    },
    {
      headers: {
        Authorization: 'Bearer ' + slackToken
      }
    }
  );
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

    console.log(JSON.stringify(slackResponse.data));
  });
