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
// [START v2import]

const {
  onNewFatalIssuePublished,
} = require("firebase-functions/alerts/crashlytics");
const {
  onNewTesterIosDevicePublished,
} = require("firebase-functions/alerts/appDistribution");
const {
  onThresholdAlertPublished,
} = require("firebase-functions/alerts/performance");
const logger = require("firebase-functions/logger");
// [END v2import]

/**
 * Posts a message to Discord with Discord's Webhook API
 *
 * @param {string} botName - The bot username to display
 * @param {string} messageBody - The message to post (Discord MarkDown)
 */
async function postMessageToDiscord(botName, messageBody) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error(
        "No webhook URL found. Set the Discord Webhook URL before deploying. Learn more about Discord webhooks here: https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks",
    );
  }

  return fetch(webhookUrl, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(
        // Here's what the Discord API supports in the payload:
        // https://discord.com/developers/docs/resources/webhook#execute-webhook-jsonform-params
        {
          content: messageBody,
          username: botName,
        },
    ),
  });
}

// [START v2Alerts]
/**
 * function triggered by Crashlytics that publishes a message
 * to Discord whenever a new fatal issue occurs.
 */
// [START v2CrashlyticsAlertTrigger]
exports.postfatalissuetodiscord = onNewFatalIssuePublished(async (event) => {
// [END v2CrashlyticsAlertTrigger]
  // [START v2CrashlyticsEventPayload]
  // construct a helpful message to send to Discord
  const appId = event.appId;
  const {id, title, subtitle, appVersion} = event.data.payload.issue;
  const message = `
🚨 New fatal issue for ${appId} in version ${appVersion} 🚨

**${title}**

${subtitle}

id: \`${id}\`
`;
  // [END v2CrashlyticsEventPayload]

  try {
    // [START v2SendToDiscord]
    const response = await postMessageToDiscord("Crashlytics Bot", message);
    if (response.ok) {
      logger.info(
          `Posted fatal Crashlytics alert ${id} for ${appId} to Discord`,
          event.data.payload,
      );
    } else {
      throw new Error(`Discord returned status code ${response.status}`);
    }
    // [END v2SendToDiscord]
  } catch (error) {
    logger.error(
        `Unable to post fatal Crashlytics alert ${id} for ${appId} to Discord`,
        error,
    );
  }
});

/**
 * function triggered by App Distribution that publishes a message
 * to Discord whenever a new iOS tester device is registered.
 */
// [START v2AppDistributionAlertTrigger]
exports.postnewduuidtodiscord = onNewTesterIosDevicePublished(async (event) => {
// [END v2AppDistributionAlertTrigger]
  // [START v2AppDistributionEventPayload]
  // construct a helpful message to send to Discord
  const appId = event.appId;
  const {
    testerDeviceIdentifier,
    testerDeviceModelName,
    testerEmail,
    testerName,
  } = event.data.payload;
  const message = `
📱 New iOS device registered by ${testerName} <${testerEmail}> for ${appId}

UDID **${testerDeviceIdentifier}** for ${testerDeviceModelName}
`;
  // [END v2AppDistributionEventPayload]

  try {
    // [START v2SendNewTesterIosDeviceToDiscord]
    const response = await postMessageToDiscord("AppDistribution Bot", message);
    if (response.ok) {
      logger.info(
          `Posted iOS device registration alert for ${testerEmail} to Discord`,
      );
    } else {
      throw new Error(`Discord returned status code ${response.status}`);
    }
    // [END v2SendNewTesterIosDeviceToDiscord]
  } catch (error) {
    logger.error(
        `Unable to post iOS device registration for ${testerEmail} to Discord`,
        error,
    );
  }
});
// [END v2Alerts]

/**
 * Function triggered by Firebase Performance Monitoring that publishes
 * a message to Discord whenever a performance threshold alert is fired.
 */
// [START v2PerformanceAlertTrigger]
exports.postperformancealerttodiscord = onThresholdAlertPublished(
    async (event) => {
      // [END v2PerformanceAlertTrigger]
      // [START v2PerformanceEventPayload]
      // construct a helpful message to send to Discord
      const appId = event.appId;
      const {
        eventName,
        metricType,
        eventType,
        numSamples,
        thresholdValue,
        thresholdUnit,
        conditionPercentile,
        appVersion,
        violationValue,
        violationUnit,
        investigateUri,
      } = event.data.payload;
      const message = `
    ⚠️ Performance Alert for ${metricType} of ${eventType}: **${eventName}** ⚠️
    
    App id: ${appId}
    Alert condition: ${thresholdValue} ${thresholdUnit}
    Percentile (if applicable): ${conditionPercentile}
    App version (if applicable): ${appVersion}
    
    Violation: ${violationValue} ${violationUnit}
    Number of samples checked: ${numSamples}
    
    **Investigate more:** ${investigateUri}
    `;
      // [END v2PerformanceEventPayload]

      try {
        // [START v2SendPerformanceAlertToDiscord]
        const response = await postMessageToDiscord(
            "Firebase Performance Bot", message);
        if (response.ok) {
          logger.info(
              `Posted Firebase Performance alert ${eventName} to Discord`,
              event.data.payload,
          );
        } else {
          throw new Error(`Discord returned status code ${response.status}`);
        }
        // [END v2SendPerformanceAlertToDiscord]
      } catch (error) {
        logger.error(
            `Unable to post Firebase Performance alert ${eventName} to Discord`,
            error,
        );
      }
    });
// [END v2Alerts]
