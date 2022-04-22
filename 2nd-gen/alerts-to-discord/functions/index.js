/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { onNewFatalIssuePublished } = require("firebase-functions/v2/alerts");
const logger = require("firebase-functions/logger");

const fetch = require("node-fetch");

/**
 * Posts a message to Discord with Discord's Webhook API
 */
async function postMessageToDiscord(botName, messageBody) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!url) {
    throw new Error(
      "No webhook URL found. Set the Discord Webhook URL before deploying. Learn more about Discord webhooks here: https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks"
    );
  }

  return fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      // Here's what the Discord API supports in the payload:
      // https://discord.com/developers/docs/resources/webhook#execute-webhook-jsonform-params
      {
        content: messageBody,
        username: botName,
      }
    ),
  });
}

export const func1 = onNewFatalIssuePublished(async (event) => {
  // construct a helpful message to send to Discord
  const { id, title, subtitle, appVersion } = event.payload;
  const message = `
🚨 New fatal issue in version ${appVersion} 🚨

**${title}**

${subtitle}

id: \`${id}\`
`;

  try {
    const response = await postMessageToDiscord("Crashlytics Bot", message);
    if (response.ok) {
      logger.info(
        `Posted fatal Crashlytics alert ${id} to Discord`,
        event.payload
      );
    } else {
      logger.error(response.error);
    }
  } catch (error) {
    logger.error(error);
  }
});
