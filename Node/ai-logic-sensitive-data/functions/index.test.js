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

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  redactSensitiveData,
  redactPrompt,
  redactResponse,
  setDlpClientForTesting,
} from "./index.js";

/**
 * Creates a mock DLP client that simulates deidentification using regex for standard infoTypes.
 */
function createMockDlpClient(opts) {
  let callCount = 0;

  const mockClient = {
    get callCount() {
      return callCount;
    },
    async getProjectId() {
      return "test-project";
    },
    async deidentifyContent(request) {
      callCount++;
      if (opts?.shouldFail) {
        throw new Error("DLP service unavailable");
      }

      const text = request?.item?.value ?? "";
      let transformed = text;

      // Mock DLP redaction rules matching default infoTypes
      transformed = transformed.replace(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        "[EMAIL_ADDRESS]"
      );
      transformed = transformed.replace(
        /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
        "[PHONE_NUMBER]"
      );
      transformed = transformed.replace(
        /\b(?:\d{4}[- ]?){3}\d{4}\b/g,
        "[CREDIT_CARD_NUMBER]"
      );
      transformed = transformed.replace(
        /\b\d{3}-\d{2}-\d{4}\b/g,
        "[US_SOCIAL_SECURITY_NUMBER]"
      );

      return [
        {
          item: { value: transformed },
          overview: { transformedBytes: transformed.length },
        },
        request,
        {},
      ];
    },
  };

  return mockClient;
}

/**
 * Invokes an AI Logic Cloud Function handler with a simulated Cloud Function request and response.
 */
function invokeAiTrigger(fn, event) {
  return new Promise((resolve, reject) => {
    const req = { body: event };
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      send(data) {
        if (this.statusCode >= 400) {
          reject(new Error(data?.message || `HTTP ${this.statusCode}`));
        } else {
          resolve(data);
        }
      },
    };
    Promise.resolve(fn(req, res)).catch(reject);
  });
}

describe("AI Logic Sensitive Data Redaction Sample", () => {
  let mockDlp;

  beforeEach(() => {
    mockDlp = createMockDlpClient();
    setDlpClientForTesting(mockDlp);
  });

  describe("redactSensitiveData helper", () => {
    it("should return empty string immediately without calling DLP", async () => {
      const result = await redactSensitiveData("");
      assert.equal(result, "");
      assert.equal(mockDlp.callCount, 0);
    });

    it("should return whitespace-only string immediately without calling DLP", async () => {
      const result = await redactSensitiveData("   \t\n  ");
      assert.equal(result, "   \t\n  ");
      assert.equal(mockDlp.callCount, 0);
    });

    it("should redact email addresses", async () => {
      const input = "Please contact me at alice@example.com for further info.";
      const result = await redactSensitiveData(input);
      assert.equal(
        result,
        "Please contact me at [EMAIL_ADDRESS] for further info."
      );
      assert.equal(mockDlp.callCount, 1);
    });

    it("should redact multiple types of sensitive info in the same text", async () => {
      const input =
        "Customer alice@example.com with phone 555-123-4567, SSN 123-45-6789, CC 4111-2222-3333-4444.";
      const result = await redactSensitiveData(input);
      assert.equal(
        result,
        "Customer [EMAIL_ADDRESS] with phone [PHONE_NUMBER], SSN [US_SOCIAL_SECURITY_NUMBER], CC [CREDIT_CARD_NUMBER]."
      );
    });

    it("should return original text when no sensitive info is detected", async () => {
      const input = "Explain quantum computing in simple terms.";
      const result = await redactSensitiveData(input);
      assert.equal(result, input);
      assert.equal(mockDlp.callCount, 1);
    });

    it("should return non-string inputs unchanged without calling DLP", async () => {
      assert.equal(await redactSensitiveData(null), null);
      assert.equal(await redactSensitiveData(undefined), undefined);
      assert.equal(await redactSensitiveData(12345), 12345);
      const obj = { foo: "bar" };
      assert.equal(await redactSensitiveData(obj), obj);
      assert.equal(mockDlp.callCount, 0);
    });

    it("should fall back to original text when DLP response is missing item or value", async () => {
      const emptyItemDlp = {
        async getProjectId() {
          return "test-project";
        },
        async deidentifyContent() {
          return [{}]; // no item
        },
      };
      setDlpClientForTesting(emptyItemDlp);

      const input = "Sensitive data test";
      const result = await redactSensitiveData(input);
      assert.equal(result, input);
    });

    it("should propagate errors thrown by the DLP service", async () => {
      const failingDlp = createMockDlpClient({ shouldFail: true });
      setDlpClientForTesting(failingDlp);

      await assert.rejects(
        async () => {
          await redactSensitiveData("test@example.com");
        },
        { message: "DLP service unavailable" }
      );
    });
  });

  describe("redactPrompt (beforeGenerateContent)", () => {
    it("should redact sensitive data from single prompt content part", async () => {
      const event = {
        data: {
          api: "google.cloud.aiplatform.v1beta1",
          model: "projects/my-project/locations/us-central1/publishers/google/models/gemini-1.5-flash",
          request: {
            contents: [
              {
                role: "user",
                parts: [
                  { text: "My email address is support@acme.org, please subscribe me." },
                ],
              },
            ],
          },
        },
      };

      const responseBody = await invokeAiTrigger(redactPrompt, event);

      assert.ok(responseBody);
      assert.equal(
        responseBody.contents[0].parts[0].text,
        "My email address is [EMAIL_ADDRESS], please subscribe me."
      );
    });

    it("should redact sensitive data across multiple conversation turns and parts", async () => {
      const event = {
        data: {
          api: "google.ai.generativelanguage.v1beta",
          model: "models/gemini-1.5-pro",
          request: {
            contents: [
              {
                role: "user",
                parts: [{ text: "Call me at 800-555-0199." }],
              },
              {
                role: "model",
                parts: [{ text: "Got it! Any other info?" }],
              },
              {
                role: "user",
                parts: [
                  { text: "Also, my email is john.doe@example.com." },
                  { text: "And SSN is 000-11-2222." },
                ],
              },
            ],
          },
        },
      };

      const responseBody = await invokeAiTrigger(redactPrompt, event);

      assert.ok(responseBody);
      assert.equal(
        responseBody.contents[0].parts[0].text,
        "Call me at [PHONE_NUMBER]."
      );
      assert.equal(
        responseBody.contents[1].parts[0].text,
        "Got it! Any other info?"
      );
      assert.equal(
        responseBody.contents[2].parts[0].text,
        "Also, my email is [EMAIL_ADDRESS]."
      );
      assert.equal(
        responseBody.contents[2].parts[1].text,
        "And SSN is [US_SOCIAL_SECURITY_NUMBER]."
      );
    });

    it("should preserve non-text parts (e.g. inlineData) untouched", async () => {
      const event = {
        data: {
          api: "google.cloud.aiplatform.v1beta1",
          model: "gemini-1.5-flash",
          request: {
            contents: [
              {
                role: "user",
                parts: [
                  { inlineData: { mimeType: "image/jpeg", data: "base64data==" } },
                  { text: "Contact contact@example.com about this image." },
                ],
              },
            ],
          },
        },
      };

      const responseBody = await invokeAiTrigger(redactPrompt, event);

      assert.ok(responseBody);
      assert.deepEqual(responseBody.contents[0].parts[0], {
        inlineData: { mimeType: "image/jpeg", data: "base64data==" },
      });
      assert.equal(
        responseBody.contents[0].parts[1].text,
        "Contact [EMAIL_ADDRESS] about this image."
      );
    });

    it("should return empty object (leaving request untouched) when prompt contains no sensitive data", async () => {
      const event = {
        data: {
          api: "google.cloud.aiplatform.v1beta1",
          model: "gemini-1.5-flash",
          request: {
            contents: [
              {
                role: "user",
                parts: [{ text: "Write a poem about the sunrise." }],
              },
            ],
          },
        },
      };

      const responseBody = await invokeAiTrigger(redactPrompt, event);
      assert.equal(responseBody.contents, undefined);
    });

    it("should leave request untouched when contents array is empty", async () => {
      const event = {
        data: {
          api: "google.cloud.aiplatform.v1beta1",
          model: "gemini-1.5-flash",
          request: {
            contents: [],
          },
        },
      };

      const responseBody = await invokeAiTrigger(redactPrompt, event);
      assert.equal(responseBody.contents, undefined);
    });

    it("should redact sensitive data in string systemInstruction", async () => {
      const event = {
        data: {
          api: "google.cloud.aiplatform.v1beta1",
          model: "gemini-1.5-pro",
          request: {
            systemInstruction: "Always BCC admin@example.com for all requests.",
            contents: [
              {
                role: "user",
                parts: [{ text: "Hello there!" }],
              },
            ],
          },
        },
      };

      const responseBody = await invokeAiTrigger(redactPrompt, event);

      assert.ok(responseBody);
      assert.equal(
        responseBody.systemInstruction,
        "Always BCC [EMAIL_ADDRESS] for all requests."
      );
    });

    it("should redact sensitive data in object systemInstruction parts", async () => {
      const event = {
        data: {
          api: "google.cloud.aiplatform.v1beta1",
          model: "gemini-1.5-pro",
          request: {
            systemInstruction: {
              role: "system",
              parts: [{ text: "Escalate emergencies to 800-555-0100 immediately." }],
            },
            contents: [
              {
                role: "user",
                parts: [{ text: "Clean text" }],
              },
            ],
          },
        },
      };

      const responseBody = await invokeAiTrigger(redactPrompt, event);

      assert.ok(responseBody);
      assert.equal(
        responseBody.systemInstruction.parts[0].text,
        "Escalate emergencies to [PHONE_NUMBER] immediately."
      );
    });

    it("should redact sensitive data in Part systemInstruction ({ text })", async () => {
      const event = {
        data: {
          api: "google.ai.generativelanguage.v1beta",
          model: "gemini-1.5-pro",
          request: {
            systemInstruction: {
              text: "Notify dev-ops at ops@example.com on error.",
            },
            contents: [
              {
                role: "user",
                parts: [{ text: "System check" }],
              },
            ],
          },
        },
      };

      const responseBody = await invokeAiTrigger(redactPrompt, event);

      assert.ok(responseBody);
      assert.equal(
        responseBody.systemInstruction.text,
        "Notify dev-ops at [EMAIL_ADDRESS] on error."
      );
    });

    it("should redact sensitive data in systemInstruction when contents array is empty", async () => {
      const event = {
        data: {
          api: "google.cloud.aiplatform.v1beta1",
          model: "gemini-1.5-flash",
          request: {
            systemInstruction: "Report to lead@startup.io immediately.",
            contents: [],
          },
        },
      };

      const responseBody = await invokeAiTrigger(redactPrompt, event);

      assert.ok(responseBody);
      assert.equal(
        responseBody.systemInstruction,
        "Report to [EMAIL_ADDRESS] immediately."
      );
    });

    it("should redact sensitive data in systemInstruction when contents is undefined", async () => {
      const event = {
        data: {
          api: "google.cloud.aiplatform.v1beta1",
          model: "gemini-1.5-flash",
          request: {
            systemInstruction: "Direct queries to support@service.com.",
          },
        },
      };

      const responseBody = await invokeAiTrigger(redactPrompt, event);

      assert.ok(responseBody);
      assert.equal(
        responseBody.systemInstruction,
        "Direct queries to [EMAIL_ADDRESS]."
      );
    });

    it("should gracefully handle undefined request", async () => {
      const event = {
        data: {},
      };

      const responseBody = await invokeAiTrigger(redactPrompt, event);
      assert.equal(responseBody.contents, undefined);
    });

    it("should safely handle contents or parts containing null or non-object items", async () => {
      const event = {
        data: {
          api: "google.cloud.aiplatform.v1beta1",
          model: "gemini-1.5-flash",
          request: {
            contents: [
              null,
              { parts: null },
              {
                role: "user",
                parts: [
                  null,
                  undefined,
                  {},
                  { text: "" },
                  { text: "Call 555-432-1098 please." },
                ],
              },
            ],
          },
        },
      };

      const responseBody = await invokeAiTrigger(redactPrompt, event);
      assert.ok(responseBody);
      assert.equal(
        responseBody.contents[2].parts[4].text,
        "Call [PHONE_NUMBER] please."
      );
    });

    it("should safely handle systemInstruction parts containing null or non-object items", async () => {
      const event = {
        data: {
          api: "google.cloud.aiplatform.v1beta1",
          model: "gemini-1.5-flash",
          request: {
            systemInstruction: {
              parts: [null, undefined, {}, { text: "Contact contact@corp.com" }],
            },
            contents: [],
          },
        },
      };

      const responseBody = await invokeAiTrigger(redactPrompt, event);
      assert.ok(responseBody);
      assert.equal(
        responseBody.systemInstruction.parts[3].text,
        "Contact [EMAIL_ADDRESS]"
      );
    });

    it("should expose the expected blockingTrigger endpoint configuration", () => {
      const endpoint = redactPrompt.__endpoint;
      assert.ok(endpoint);
      assert.equal(endpoint.platform, "gcfv2");
      assert.equal(
        endpoint.blockingTrigger?.eventType,
        "google.firebase.ailogic.v1.beforeGenerate"
      );
    });
  });

  describe("redactResponse (afterGenerateContent)", () => {
    it("should redact sensitive data from candidate text", async () => {
      const event = {
        data: {
          api: "google.cloud.aiplatform.v1beta1",
          model: "gemini-1.5-flash",
          response: {
            candidates: [
              {
                content: {
                  role: "model",
                  parts: [
                    {
                      text: "We have updated your record. The receipt was sent to customer@example.com.",
                    },
                  ],
                },
                finishReason: "STOP",
                index: 0,
              },
            ],
          },
        },
      };

      const responseBody = await invokeAiTrigger(redactResponse, event);

      assert.ok(responseBody);
      assert.equal(
        responseBody.candidates[0].content.parts[0].text,
        "We have updated your record. The receipt was sent to customer@example.com."
          .replace("customer@example.com", "[EMAIL_ADDRESS]")
      );
      assert.equal(responseBody.candidates[0].finishReason, "STOP");
      assert.equal(responseBody.candidates[0].index, 0);
    });

    it("should redact sensitive data across multiple candidates", async () => {
      const event = {
        data: {
          api: "google.cloud.aiplatform.v1beta1",
          model: "gemini-1.5-flash",
          response: {
            candidates: [
              {
                content: {
                  role: "model",
                  parts: [{ text: "Candidate 1: Call 123-456-7890." }],
                },
                index: 0,
              },
              {
                content: {
                  role: "model",
                  parts: [{ text: "Candidate 2: Email dev@example.com." }],
                },
                index: 1,
              },
            ],
          },
        },
      };

      const responseBody = await invokeAiTrigger(redactResponse, event);

      assert.ok(responseBody);
      assert.equal(
        responseBody.candidates[0].content.parts[0].text,
        "Candidate 1: Call [PHONE_NUMBER]."
      );
      assert.equal(
        responseBody.candidates[1].content.parts[0].text,
        "Candidate 2: Email [EMAIL_ADDRESS]."
      );
    });

    it("should return empty object (leaving response untouched) when response candidates have no sensitive data", async () => {
      const event = {
        data: {
          api: "google.cloud.aiplatform.v1beta1",
          model: "gemini-1.5-flash",
          response: {
            candidates: [
              {
                content: {
                  role: "model",
                  parts: [{ text: "Here is a safe summary of the weather." }],
                },
              },
            ],
          },
        },
      };

      const responseBody = await invokeAiTrigger(redactResponse, event);
      assert.equal(responseBody.candidates, undefined);
    });

    it("should leave response untouched when response candidates array is empty", async () => {
      const event = {
        data: {
          api: "google.cloud.aiplatform.v1beta1",
          model: "gemini-1.5-flash",
          response: {
            candidates: [],
          },
        },
      };

      const responseBody = await invokeAiTrigger(redactResponse, event);
      assert.equal(responseBody.candidates, undefined);
    });

    it("should gracefully handle undefined response", async () => {
      const event = {
        data: {},
      };

      const responseBody = await invokeAiTrigger(redactResponse, event);
      assert.equal(responseBody.candidates, undefined);
    });

    it("should safely handle candidate with missing content (e.g. SAFETY block)", async () => {
      const event = {
        data: {
          api: "google.cloud.aiplatform.v1beta1",
          model: "gemini-1.5-flash",
          response: {
            candidates: [
              {
                finishReason: "SAFETY",
                index: 0,
              },
            ],
          },
        },
      };

      const responseBody = await invokeAiTrigger(redactResponse, event);
      assert.equal(responseBody.candidates, undefined);
    });

    it("should safely handle candidate containing null or non-object parts", async () => {
      const event = {
        data: {
          api: "google.cloud.aiplatform.v1beta1",
          model: "gemini-1.5-flash",
          response: {
            candidates: [
              {
                content: {
                  role: "model",
                  parts: [
                    null,
                    undefined,
                    {},
                    { text: "" },
                    { text: "Your temporary code is sent to user@domain.com." },
                  ],
                },
                index: 0,
              },
            ],
          },
        },
      };

      const responseBody = await invokeAiTrigger(redactResponse, event);
      assert.ok(responseBody);
      assert.equal(
        responseBody.candidates[0].content.parts[4].text,
        "Your temporary code is sent to [EMAIL_ADDRESS]."
      );
    });

    it("should expose the expected blockingTrigger endpoint configuration", () => {
      const endpoint = redactResponse.__endpoint;
      assert.ok(endpoint);
      assert.equal(endpoint.platform, "gcfv2");
      assert.equal(
        endpoint.blockingTrigger?.eventType,
        "google.firebase.ailogic.v1.afterGenerate"
      );
    });
  });
});
