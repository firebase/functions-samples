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
const {onCallGenkit} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");

// Dependencies for Genkit
const {gemini15Flash, googleAI} = require("@genkit-ai/googleai");
const {genkit, z} = require("genkit");
// [END imports]

// Store the Gemini API key in Cloud Secret Manager
const apiKey = defineSecret("GOOGLE_GENAI_API_KEY");

const ai = genkit({
  plugins: [googleAI()],
  model: gemini15Flash,
});

const jokeTeller = ai.defineFlow({
  name: "joketeller",
  inputSchema: z.string().nullable(),
  outputSchema: z.string(),
  streamSchema: z.string(),
}, async (jokeType = "knock-knock", response) => {
  const prompt = `Tell me a ${jokeType} joke.`;
  const {stream, response: aiResponse} = ai.generateStream(prompt);

  // Loop over the `stream` async iterable to
  // send new words of the AI response
  // to the client as they're generated
  for await (const chunk of stream) {
    response.sendChunk(chunk.text);
  }

  // Return the full response
  return (await aiResponse).text;
},
);

exports.tellJoke = onCallGenkit({
  // bind the Gemini API key secret parameter  to the function
  secrets: [apiKey],
},
// pass in the genkit flow
jokeTeller,
);


