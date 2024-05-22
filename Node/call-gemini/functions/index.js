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
 const {onCall, HttpsError} = require("firebase-functions/v2/https");
 const {logger} = require("firebase-functions/v2");
 const { GoogleGenerativeAI } = require("@google/generative-ai");
 const { defineSecret, defineBoolean } = require('firebase-functions/params');

 const geminiToken = defineSecret("API_TOKEN", {
  description: "Gemini API token. Created using " +
      "https://ai.google.dev/tutorials/get_started_node#set-up-project",
});

const appCheckRequired = defineBoolean("APP_CHECK_REQUIRED");
const authRequired = defineBoolean("AUTH_REQUIRED");

 exports.callGemini = onCall({secrets: [geminiToken], enforceAppCheck: appCheckRequired }, async (request) => {

    if (authRequired.val() && !request.auth) {
        throw new HttpsError(
          "failed-precondition",
          "The function must be called while authenticated.",
        );
    }
  const genAI = new GoogleGenerativeAI(geminiToken.value());

  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: "gemini-pro"});

  const prompt = "Write a story about a magic backpack."

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  return {text};
 })
