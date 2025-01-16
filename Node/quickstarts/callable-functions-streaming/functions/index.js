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

// [START imports]
// Dependencies for callable functions.
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {logger} = require("firebase-functions/v2");
// [END imports]

/**
 * Mock api for streaming response
 */
async function generateStream() {
  // simulate some latency for a remote API call
  await new Promise((resolve) => setTimeout(resolve, 100));

  /**
   * Fake a few async responses
   */
  async function* mockAsyncIterable() {
    const sentence = "Hello from Cloud Functions for Firebase!";

    for (const word of sentence.split(" ")) {
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 500));
      yield {text: () => " " + word};
    }
  }

  return {
    metadata: {
      acceptsStreaming: true},
    stream: mockAsyncIterable,
  };
}

exports.streamResponse = onCall(async (request, response) => {
  console.log("I was called!!!");
  console.log("data", request.data);
  const prompt = request.data.text || "hello";

  const {metadata, stream} = await generateStream(prompt);

  for await (const chunk of stream()) {
    console.log(chunk);
    if (metadata.acceptsStreaming) {
      response.sendChunk(chunk.text());
    }
  }
  return true;
});
