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
"use strict";

const functions = require("firebase-functions/v1");
const fetch = require("node-fetch");
const crypto = require("node:crypto");
const secureCompare = require("secure-compare");

/**
 * Webhook that will be called each time there is a new GitHub commit and will post a message to
 * Slack.
 */
exports.githubWebhook = functions.https.onRequest(async (req, res) => {
  const cipher = "sha1";
  const signature = req.headers["x-hub-signature"];

  // TODO: Configure the `github.secret` Google Cloud environment variables.
  const hmac = crypto
    .createHmac(cipher, functions.config().github.secret)
    .update(req.rawBody)
    .digest("hex");
  const expectedSignature = `${cipher}=${hmac}`;

  // Check that the body of the request has been signed with the GitHub Secret.
  if (!secureCompare(signature, expectedSignature)) {
    functions.logger.error(
      "x-hub-signature",
      signature,
      "did not match",
      expectedSignature,
    );
    res.status(403).send("Your x-hub-signature's bad and you should feel bad!");
    return;
  }

  try {
    await postToSlack(
      req.body.compare,
      req.body.commits.length,
      req.body.repository,
    );
    res.end();
  } catch (error) {
    functions.logger.error(error);
    res
      .status(500)
      .send("Something went wrong while posting the message to Slack.");
  }
});

/**
 * Post a message to Slack about the new GitHub commit.
 */
async function postToSlack(url, commits, repo) {
  const response = await fetch(functions.config().slack.webhook_url, {
    method: "POST",
    body: JSON.stringify({
      text: `<${url}|${commits} new commit${
        commits > 1 ? "s" : ""
      }> pushed to <${repo.url}|${repo.full_name}>.`,
    }),
    headers: { "Content-Type": "application/json" },
  });
  return response.json();
}
