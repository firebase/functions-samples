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
      const randomDelay = Math.floor(Math.random() * 500);
      await new Promise((resolve) => setTimeout(resolve, randomDelay));
      yield {text: () => " " + word};
    }

    return {text: () => sentence};
  }

  return mockAsyncIterable;
}

exports.streamResponse = onCall(async (request, response) => {
  const prompt = request.data?.text || "hello world";

  try {
    // Call a streaming API, like an LLM
    const stream = await generateStream(prompt);

    if (request.acceptsStreaming) {
      // Wait for each value of the returned Async Iterable
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator
      for await (const chunk of stream()) {
        response.sendChunk(chunk.text());
      }
    }

    return await stream.text();
  } catch (error) {
    throw new HttpsError("internal", error.message);
  }
});
