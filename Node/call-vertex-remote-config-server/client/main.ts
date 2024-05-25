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

import { initializeApp } from "firebase/app";
import { firebaseConfig, RECAPTCHA_ENTERPRISE_SITE_KEY } from "./config";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";
import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
} from "firebase/functions";

// Set to true to test in emulator.
const testMode = true;

// Use showdown to convert Gemini-provided Markdown to HTML
import { Converter } from "showdown";
const converter = new Converter();

// Set up output elements.
const outputDiv = document.createElement("div");
document.body.appendChild(outputDiv);

// Initialize Firebase app.
const app = initializeApp(firebaseConfig);

// Initialize App Check.
initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_ENTERPRISE_SITE_KEY),
});

// Define callVertexWithRC as a call to the callVertexWithRC function.
const callVertexWithRC = httpsCallable(getFunctions(), "callVertexWithRC", {
  limitedUseAppCheckTokens: true,
});

// Enable emulator so that it can be used in test mode.
const functions = getFunctions(app, "us-central1"); // Replace with your region

if (testMode) {
  connectFunctionsEmulator(functions, "localhost", 5001);
}

// Generate body for index.html.
document.body.innerHTML += `
    
    <div id="waitingMessage"></div>
    <div id="generatedText"></div>
    <div id="errorMessage"></div>
    <br/>
    <form id="promptForm">
        <label for="promptInput">Ask Gemini a question!</label><br>
        <input type="text" id="promptInput" name="prompt"><br><br>
        <input type="submit" value="Submit">
    </form>
`;

const promptForm = document.getElementById("promptForm") as HTMLFormElement;

promptForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const promptInput = document.getElementById(
    "promptInput"
  ) as HTMLInputElement;
  const prompt = promptInput.value;

  const waitingMessageElement = document.getElementById("waitingMessage");
  waitingMessageElement.textContent = "Waiting for response...";

  try {
    const { data } = await callVertexWithRC({ prompt });
    const generatedTextElement = document.getElementById("generatedText"); // Access the element
    const htmlContent = converter.makeHtml(data);
    if (!generatedTextElement) {
      throw new Error("Missing generated text.");
    }
    generatedTextElement.innerHTML = htmlContent; // Set the element's content
    waitingMessageElement.textContent = "";

  } catch (error) {
    const errorMessageElement = document.getElementById("errorMessage");
    errorMessageElement.textContent = "Error calling generateWithVertex: " + error.message;
    waitingMessageElement.textContent = "";
  }
});
