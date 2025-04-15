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

import { onInAppFeedbackPublished } from "firebase-functions/v2/alerts/appDistribution";
import {
  defineInt,
  defineSecret,
  defineString,
} from "firebase-functions/params";
import logger from "firebase-functions/logger";
import fetch from "node-fetch";
import { FormData } from "formdata-polyfill/esm.min.js";

// The keys are either defined in .env or they are created
// via prompt in the CLI before deploying
const jiraUriConfig = defineString("JIRA_URI", {
  description:
    "URI of your Jira instance (e.g. 'https://mysite.atlassian.net')",
  input: {
    text: {
      validationRegex: /^https:\/\/.*/,
      validationErrorMessage: "Please enter an 'https://' URI",
    },
  },
});
const projectKeyConfig = defineString("PROJECT_KEY", {
  description: "Project key of your Jira instance (e.g. 'XY')",
});
const issueTypeIdConfig = defineInt("ISSUE_TYPE_ID", {
  description: "Issue type ID for the Jira issues being created",
  default: 10001,
});
const issueLabelConfig = defineString("ISSUE_LABEL", {
  description: "Label for the Jira issues being created",
  default: "in-app",
});
const apiTokenOwnerConfig = defineString("API_TOKEN_OWNER", {
  description: "Owner of the Jira API token",
  input: {
    text: {
      validationRegex:
        /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
      validationErrorMessage: "Please enter a valid email address",
    },
  },
});
const apiTokenConfig = defineSecret("API_TOKEN", {
  description:
    "Jira API token. Created using " +
    "https://id.atlassian.com/manage-profile/security/api-tokens",
});

export const handleInAppFeedback = async (event) => {
  const issueUri = await createIssue(event);
  if (event.data.payload.screenshotUri) {
    await uploadScreenshot(issueUri, event.data.payload.screenshotUri);
  }
  return undefined; // returns 204 (no content) which is ignored
};

export const feedbacktojira = onInAppFeedbackPublished(
  { secrets: [apiTokenConfig] },
  handleInAppFeedback,
);

/**
 * Creates "Authorization" header value.
 * @return {string} Basic, base64-encoded "Authorization" header value
 */
function authHeader() {
  return (
    "Basic " +
    Buffer.from(
      apiTokenOwnerConfig.value() + ":" + apiTokenConfig.value(),
    ).toString("base64")
  );
}

/**
 * Creates new issue in Jira.
 * @param {AlertEvent<InAppFeedbackPayload>} event
 */
async function createIssue(event) {
  const requestJson = await buildCreateIssueRequest(event);
  const requestBody = JSON.stringify(requestJson);
  const response = await fetch(`${jiraUriConfig.value()}/rest/api/3/issue`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: requestBody,
  });
  if (!response.ok) {
    throw new Error(
      "Issue creation failed: " +
        `${response.status} ${response.statusText} for ` +
        requestBody,
    );
  }
  const json = await response.json();
  return json.self; // issueUri
}

/**
 * Uploads screenshot to Jira (after downloading it from Firebase).
 * @param {string} issueUri URI of the Jira issue
 * @param {string} screenshotUri URI of the screenshot hosted by Firebase
 */
async function uploadScreenshot(issueUri, screenshotUri) {
  const dlResonse = await fetch(screenshotUri);
  if (!dlResonse.ok) {
    throw new Error(
      "Screenshot download failed: " +
        `${dlResonse.status} ${dlResonse.statusText}`,
    );
  }
  const blob = await dlResonse.blob();

  const form = new FormData();
  form.append("file", blob, "screenshot.png");
  const ulResponse = await fetch(issueUri + "/attachments", {
    method: "POST",
    body: form,
    headers: {
      Authorization: authHeader(),
      Accept: "application/json",
      "X-Atlassian-Token": "no-check",
    },
  });
  if (!ulResponse.ok) {
    throw new Error(
      "Screenshot upload failed: " +
        `${ulResponse.status} ${ulResponse.statusText}`,
    );
  }
}

/**
 * Looks up Jira user ID.
 * @param {string} testerEmail Email address of tester who filed feedback
 */
async function lookupReporter(testerEmail) {
  const response = await fetch(
    `${jiraUriConfig.value()}/rest/api/3/user/search` + `?query=${testerEmail}`,
    {
      method: "GET",
      headers: {
        Authorization: authHeader(),
        Accept: "application/json",
      },
    },
  );
  if (!response.ok) {
    logger.info(
      `Failed to find Jira user for '${testerEmail}':` +
        `${response.status} ${response.statusText}`,
    );
  }
  const json = await response.json();
  return json.length > 0 ? json[0].accountId : undefined;
}

/**
 * Builds payload for creating a Jira issue.
 * @param {AlertEvent<InAppFeedbackPayload>} event
 */
async function buildCreateIssueRequest(event) {
  let summary = "In-app feedback: " + event.data.payload.text;
  summary = summary.replace(/[\n\r].*/g, "");
  if (summary.length > 40) {
    summary = summary.substring(0, 39) + "…";
  }
  const json = {
    update: {},
    fields: {
      summary: summary,
      issuetype: {
        id: issueTypeIdConfig.value(),
      },
      project: {
        key: projectKeyConfig.value(),
      },
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                text: "Firebase App ID: ",
                type: "text",
                marks: [
                  {
                    type: "strong",
                  },
                ],
              },
              {
                text: event.appId,
                type: "text",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                text: "App Version: ",
                type: "text",
                marks: [
                  {
                    type: "strong",
                  },
                ],
              },
              {
                text: event.data.payload.appVersion,
                type: "text",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                text: "Tester Email: ",
                type: "text",
                marks: [
                  {
                    type: "strong",
                  },
                ],
              },
              {
                text: event.data.payload.testerEmail,
                type: "text",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                text: "Tester Name: ",
                type: "text",
                marks: [
                  {
                    type: "strong",
                  },
                ],
              },
              {
                text: event.data.payload.testerName || "None",
                type: "text",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                text: "Feedback text: ",
                type: "text",
                marks: [
                  {
                    type: "strong",
                  },
                ],
              },
              {
                text: event.data.payload.text,
                type: "text",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                text: "Console link",
                type: "text",
                marks: [
                  {
                    type: "link",
                    attrs: {
                      href: event.data.payload.feedbackConsoleUri,
                      title: "Firebase console",
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      labels: [issueLabelConfig.value()],
    },
  };
  const reporter = await lookupReporter(event.data.payload.testerEmail);
  if (reporter) {
    json.fields.reporter = { id: reporter };
  }
  return json;
}
