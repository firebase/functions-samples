import {
  onInAppFeedbackPublished} from "firebase-functions/v2/alerts/appDistribution";
import fetch from "node-fetch";
import {FormData} from "formdata-polyfill/esm.min.js";
import logger from "firebase-functions/logger";

const JIRA_URI = "https://mysite.atlassian.net";
const PROJECT_KEY = "XY";
const ISSUE_TYPE_ID = "10001";
const ISSUE_LABELS = ["in-app"];
const API_KEY_OWNER = "user@e,mail";
const API_KEY = "am9zaHVhIHBhc3N3b3JkMTIz";
const AUTH_HEADER = "Basic " +
      Buffer.from(`${API_KEY_OWNER}:${API_KEY}`).toString("base64");

export const handleInAppFeedback = async (event) => {
  const issueUri = await createIssue(event);
  if (event.data.payload.screenshotUri) {
    await uploadScreenshot(issueUri, event.data.payload.screenshotUri);
  }
  return true;
};

export const feedbacktojira = onInAppFeedbackPublished(handleInAppFeedback);

/**
 * Creates new issue in Jira.
 * @param {AlertEvent<InAppFeedbackPayload>} event
 */
async function createIssue(event) {
  const requestJson = await buildCreateIssueRequest(event);
  const requestBody = JSON.stringify(requestJson);
  const response =
        await fetch("https://eventarc.atlassian.net/rest/api/3/issue", {
          method: "POST",
          headers: {
            "Authorization": AUTH_HEADER,
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
          body: requestBody,
        });
  if (!response.ok) {
    throw new Error("Issue creation failed: " +
                    `${response.status} ${response.statusText} for ` +
                    requestBody);
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
    throw new Error("Screenshot download failed: " +
                    `${dlResonse.status} ${dlResonse.statusText}`);
  }
  const blob = await dlResonse.blob();

  const form = new FormData();
  form.append("file", blob, "screenshot.png");
  const ulResponse = await fetch(issueUri + "/attachments", {
    method: "POST",
    body: form,
    headers: {
      "Authorization": AUTH_HEADER,
      "Accept": "application/json",
      "X-Atlassian-Token": "no-check",
    },
  });
  if (!ulResponse.ok) {
    throw new Error("Screenshot upload failed: " +
                    `${ulResponse.status} ${ulResponse.statusText}`);
  }
}

/**
 * Looks up Jira user ID.
 * @param {string} testerEmail Email address of tester who filed feedback
 */
async function lookupReporter(testerEmail) {
  const response =
        await fetch(`${JIRA_URI}/rest/api/3/user/search?query=${testerEmail}`, {
          method: "GET",
          headers: {"Authorization": AUTH_HEADER, "Accept": "application/json"},
        });
  if (!response.ok) {
    logger.info(`Failed to find Jira user for '${testerEmail}':` +
                `${response.status} ${response.statusText}`);
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
    "update": {},
    "fields": {
      "summary": summary,
      "issuetype": {
        "id": ISSUE_TYPE_ID,
      },
      "project": {
        "key": PROJECT_KEY,
      },
      "description": {
        "type": "doc",
        "version": 1,
        "content": [
          {
            "type": "paragraph",
            "content": [
              {
                "text": "Firebase App ID: ",
                "type": "text",
                "marks": [
                  {
                    "type": "strong",
                  },
                ],
              },
              {
                "text": event.appId,
                "type": "text",
              },
            ],
          },
          {
            "type": "paragraph",
            "content": [
              {
                "text": "App Version: ",
                "type": "text",
                "marks": [
                  {
                    "type": "strong",
                  },
                ],
              },
              {
                "text": event.data.payload.appVersion,
                "type": "text",
              },
            ],
          },
          {
            "type": "paragraph",
            "content": [
              {
                "text": "Tester Email: ",
                "type": "text",
                "marks": [
                  {
                    "type": "strong",
                  },
                ],
              },
              {
                "text": event.data.payload.testerEmail,
                "type": "text",
              },
            ],
          },
          {
            "type": "paragraph",
            "content": [
              {
                "text": "Tester Name: ",
                "type": "text",
                "marks": [
                  {
                    "type": "strong",
                  },
                ],
              },
              {
                "text": event.data.payload.testerName || "None",
                "type": "text",
              },
            ],
          },
          {
            "type": "paragraph",
            "content": [
              {
                "text": "Feedback text: ",
                "type": "text",
                "marks": [
                  {
                    "type": "strong",
                  },
                ],
              },
              {
                "text": event.data.payload.text,
                "type": "text",
              },
            ],
          },
          {
            "type": "paragraph",
            "content": [
              {
                "text": "Console link",
                "type": "text",
                "marks": [
                  {
                    "type": "link",
                    "attrs": {
                      "href": event.data.payload.feedbackConsoleUri,
                      "title": "Firebase console",
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      "labels": ISSUE_LABELS,
    },
  };
  const reporter = await lookupReporter(event.data.payload.testerEmail);
  if (reporter) {
    json.fields.reporter = {"id": reporter};
  }
  return json;
}
