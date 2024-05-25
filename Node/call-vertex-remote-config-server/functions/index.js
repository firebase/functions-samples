/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// [START remote_config_server_vertex_init]
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

const { initializeApp } = require("firebase-admin/app");
const { VertexAI } = require("@google-cloud/vertexai");
const { getRemoteConfig } = require("firebase-admin/remote-config");

// Allow all origins. Set origin to restrict domain access.
const cors = require("cors")({ origin: true });

// Set and check environment variables.
const project = process.env.GCLOUD_PROJECT;

// Enable App Check
const appCheckRequired = true;

// Initialize Firebase.
const app = initializeApp();
// [END remote_config_server_vertex_init]

// [START remote_config_server_vertex_default_values]
// Define default (fallback) parameter values for Remote Config.
const defaultConfig = {
  // Default values for Vertex AI.
  model_name: "gemini-1.5-flash-preview-0514",
  generation_config: [
    {
      stopSequences: [],
      temperature: 0.7,
      maxOutputTokens: 64,
      topP: 0.1,
      topK: 20,
    },
  ],
  prompt:
    "I'm a developer who wants to learn about Firebase and you are a \
    helpful assistant who knows everything there is to know about Firebase!",
  safety_settings: [
    {
      category: "HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE",
    },
  ],

  // Vertex AI location.
  location: "us-central1",

  // Disable Vertex AI Gemini API access for testing.
  vertex_enabled: false,
};
// [END remote_config_server_vertex_default_values]

// [START remote_config_server_vertex_create_function]
// Export the function.
exports.callVertexWithRC = onCall(
  {
    enforceAppCheck: appCheckRequired, // Enable App Check enforcement
    consumeAppCheckToken: false, // Don't consume the token (optional)
  },
  async (data, context) => {
    try {
      // Set up Remote Config.
      const rc = getRemoteConfig(app);

      // Get the Remote Config template and assign default values.
      const template = await rc.getServerTemplate({
        defaultConfig: defaultConfig,
      });

      // Add the template evaluation to a constant.
      const config = template.evaluate();

      // Obtain values from Remote Config.
      const textModel =
        config.getString("model_name") || defaultConfig.model_name;
      const textPrompt = config.getString("prompt") || defaultConfig.prompt;
      const generationConfig =
        config.getString("generation_config") ||
        defaultConfig.generation_config;
      const safetySettings =
        config.getString("safety_settings") || defaultConfig.safety_settings;
      const location = config.getString("location") || defaultConfig.location;
      const vertexEnabled =
        config.getBoolean("is_vertex_enabled") || defaultConfig.vertex_enabled;
      // [END remote_config_server_vertex_create_function]

      // [START remote_config_server_vertex_function_logic]
      // Allow user input.
      const userInput = data.data.prompt || "";

      // Instantiate Vertex AI.
      const vertex_ai = new VertexAI({ project: project, location: location });
      const generativeModel = vertex_ai.getGenerativeModel({
        model: textModel,
        safety_settings: safetySettings,
        generation_config: generationConfig,
      });

      // Create the chat; append user input to Remote Config-defined prompt.
      const chat = generativeModel.startChat();
      const chatInput = textPrompt + " " + userInput;

      if (!chatInput) {
        throw new HttpsError("invalid-argument", "Missing text prompt");
      }

      // Check if Vertex AI is enabled
      if (vertexEnabled !== true) {
        logger.log("Vertex AI is not enabled");
        return;
      }
      logger.log(
        "\nRunning with model ",
        textModel,
        ", prompt: ",
        textPrompt,
        ", generationConfig: ",
        generationConfig,
        ", safetySettings: ",
        safetySettings,
        " in ",
        location,
        "\n"
      );

      const result = await chat.sendMessageStream(chatInput);

      const chunks = [];
      for await (const item of result.stream) {
        const chunk = item.candidates[0].content.parts[0].text;
        logger.log("Received chunk:", chunk);
        chunks.push(chunk);
      }

      return chunks.join(""); // Return the concatenated chunks
    } catch (error) {
      console.error(error);
      throw new HttpsError("internal", "Internal server error");
    }
  }
);
// [END remote_config_server_vertex_function_logic]
