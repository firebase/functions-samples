/**
 * Copyright 2024 Google LLC
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

// [START ai_logic_sensitive_data_all]
// [START ai_logic_pre_request]
// [START ai_logic_imports]
import { logger } from "firebase-functions/logger";
import { requiresRole, requiresAPI } from "firebase-functions";
import {
  beforeGenerateContent,
  afterGenerateContent,
  HttpsError,
} from "firebase-functions/v2/ai";
import { DlpServiceClient } from "@google-cloud/dlp";
// [END ai_logic_imports]

// Declaratively declare required IAM role and Google Cloud API for the function.
requiresRole("roles/dlp.user");
requiresAPI(
  "dlp.googleapis.com",
  "Required for Cloud Sensitive Data Protection de-identification"
);

// [START ai_logic_redact_helper]
let dlp = new DlpServiceClient();

/**
 * Redacts sensitive data from a text string using Cloud Sensitive Data Protection (DLP).
 *
 * Inspects for sensitive infoTypes (email address, phone number)
 * and replaces detected values with their infoType placeholder (for example, "[EMAIL_ADDRESS]").
 *
 * @param {string} text - The raw input text string to inspect and redact.
 * @returns {Promise<string>} The redacted text, or the original text if empty or unchanged.
 */
export async function redactSensitiveData(text) {
  if (typeof text !== "string" || !text.trim()) {
    return text;
  }

  const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;

  try {
    const [response] = await dlp.deidentifyContent({
      parent: `projects/${projectId}/locations/global`,
      item: { value: text },
      inspectConfig: {
        infoTypes: [
          { name: "EMAIL_ADDRESS" },
          { name: "PHONE_NUMBER" },
        ],
      },
      deidentifyConfig: {
        infoTypeTransformations: {
          transformations: [
            {
              primitiveTransformation: {
                replaceWithInfoTypeConfig: {},
              },
            },
          ],
        },
      },
    });

    return response?.item?.value ?? text;
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    logger.error("Failed to inspect and redact sensitive data via Cloud DLP", {
      error: error instanceof Error ? error.message : String(error),
      projectId,
    });
    throw new HttpsError(
      "internal",
      "Failed to inspect and redact sensitive data."
    );
  }
}
// [END ai_logic_redact_helper]

// [START ai_logic_before_generate_content]
/**
 * Pre-request trigger for Firebase AI Logic.
 * Runs before each generateContent request is forwarded to the Gemini API.
 * Intercepts the request and redacts sensitive data (PII) from prompt contents
 * and system instructions before reaching the model.
 */
export const redactPrompt = beforeGenerateContent(async (event) => {
  const request = event?.data?.request;
  if (!request) return;

  let modified = false;

  // Redact sensitive data from prompt contents concurrently across parts
  const textParts = [];
  const contents = Array.isArray(request.contents) ? request.contents : [];
  for (const content of contents) {
    for (const part of content?.parts ?? []) {
      if (part?.text) {
        textParts.push(part);
      }
    }
  }

  await Promise.all(
    textParts.map(async (part) => {
      const redacted = await redactSensitiveData(part.text);
      if (redacted !== part.text) {
        part.text = redacted;
        modified = true;
      }
    })
  );

  // Redact sensitive data from system instruction if present
  if (typeof request.systemInstruction === "string") {
    const redacted = await redactSensitiveData(request.systemInstruction);
    if (redacted !== request.systemInstruction) {
      request.systemInstruction = redacted;
      modified = true;
    }
  } else if (
    request.systemInstruction &&
    "parts" in request.systemInstruction &&
    Array.isArray(request.systemInstruction.parts)
  ) {
    const systemParts = [];
    for (const part of request.systemInstruction.parts) {
      if (part && typeof part === "object" && "text" in part && part.text) {
        systemParts.push(part);
      }
    }
    await Promise.all(
      systemParts.map(async (part) => {
        const redacted = await redactSensitiveData(part.text);
        if (redacted !== part.text) {
          part.text = redacted;
          modified = true;
        }
      })
    );
  } else if (
    request.systemInstruction &&
    "text" in request.systemInstruction &&
    typeof request.systemInstruction.text === "string"
  ) {
    const redacted = await redactSensitiveData(request.systemInstruction.text);
    if (redacted !== request.systemInstruction.text) {
      request.systemInstruction.text = redacted;
      modified = true;
    }
  }

  // Returning nothing (or undefined) leaves the request untouched.
  // If modified, return the updated request object.
  if (modified) {
    logger.info("Redacted sensitive data from prompt request", {
      contentCount: request.contents?.length ?? 0,
    });
    return request;
  }
});
// [END ai_logic_before_generate_content]
// [END ai_logic_pre_request]

// [START ai_logic_after_generate_content]
/**
 * Post-request trigger for Firebase AI Logic.
 * Runs after the model generates a response and before it is returned to the client.
 * Inspects all response candidates and redacts any sensitive data generated by the model.
 */
export const redactResponse = afterGenerateContent(async (event) => {
  const response = event?.data?.response;
  if (!Array.isArray(response?.candidates)) return;

  let modified = false;

  // Redact sensitive data from model response candidates concurrently
  const candidateParts = [];
  for (const candidate of response.candidates) {
    for (const part of candidate?.content?.parts ?? []) {
      if (part?.text) {
        candidateParts.push(part);
      }
    }
  }

  await Promise.all(
    candidateParts.map(async (part) => {
      const redacted = await redactSensitiveData(part.text);
      if (redacted !== part.text) {
        part.text = redacted;
        modified = true;
      }
    })
  );

  // Returning nothing (or undefined) leaves the response untouched.
  // If modified, return the updated response object.
  if (modified) {
    logger.info("Redacted sensitive data from model response candidates", {
      candidateCount: response.candidates.length,
    });
    return response;
  }
});
// [END ai_logic_after_generate_content]
// [END ai_logic_sensitive_data_all]

/**
 * Allows injecting a custom DlpServiceClient for testing purposes.
 * @internal
 */
export function setDlpClientForTesting(client) {
  dlp = client;
}
