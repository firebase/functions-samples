import { ReasoningEngineExecutionServiceClient, helpers } from "@google-cloud/aiplatform";
import { PROJECT_ID, LOCATION, REASONING_ENGINE_ID } from "./config";

const client = new ReasoningEngineExecutionServiceClient({
  apiEndpoint: `${LOCATION}-aiplatform.googleapis.com`,
});

export const callReasoningEngine = async (method: string, input: any) => {
  const name = `projects/${PROJECT_ID}/locations/${LOCATION}/reasoningEngines/${REASONING_ENGINE_ID}`;
  // Remove undefined properties to prevent serialization errors
  const cleanInput = Object.fromEntries(
    Object.entries(input || {}).filter(([_, v]) => v !== undefined)
  );

  const [response] = await client.queryReasoningEngine({
    name,
    classMethod: method,
    input: (helpers.toValue(cleanInput) as any)?.structValue,
  });
  // Safely check if response.output is defined
  try {
    if (!response.output || Object.keys(response.output).length === 0) {
      return null;
    }
    return helpers.fromValue(response.output as any);
  } catch (e) {
    console.warn("Could not parse Reasoning Engine output", JSON.stringify(response.output), e);
    return null;
  }
};

export const callReasoningEngineStream = async (method: string, input: any) => {
  const name = `projects/${PROJECT_ID}/locations/${LOCATION}/reasoningEngines/${REASONING_ENGINE_ID}`;
  // Remove undefined properties to prevent serialization errors
  const cleanInput = Object.fromEntries(
    Object.entries(input || {}).filter(([_, v]) => v !== undefined)
  );

  return new Promise((resolve, reject) => {
    try {
      const stream = client.streamQueryReasoningEngine({
        name,
        classMethod: method,
        input: (helpers.toValue(cleanInput) as any)?.structValue,
      }, { timeout: 300000 }); // Increase timeout to 5 minutes

      let fullText = "";
      const chunks: any[] = [];

      stream.on('data', (response: any) => {
        if (response.data) {
          try {
            const parsed = JSON.parse(response.data.toString('utf8'));
            chunks.push(parsed);
            if (parsed.content && parsed.content.parts) {
              fullText += parsed.content.parts.map((p: any) => p.text || "").join("");
            }
          } catch (e) {
            // keep going
          }
        }
      });

      stream.on('end', () => {
        resolve({ response: fullText, chunks });
      });

      stream.on('error', (err: any) => {
        reject(err);
      });
    } catch (e) {
      reject(e);
    }
  });
};
