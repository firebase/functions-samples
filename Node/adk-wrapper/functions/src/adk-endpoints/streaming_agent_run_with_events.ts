import { onCall } from "firebase-functions/v2/https";
import { callReasoningEngineStream } from "../common/adk";
import { ENFORCE_APP_CHECK, REPLAY_PROTECTED } from "../common/config";

/**
 * Streams responses asynchronously from the ADK application.
 * Meant for invocation from AgentSpace.
 */
export const streaming_agent_run_with_events = onCall({
  timeoutSeconds: 3600,
  enforceAppCheck: ENFORCE_APP_CHECK,
  consumeAppCheckToken: REPLAY_PROTECTED,
}, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new Error("Unauthorized");
  }
  const { request_json } = request.data;
  return await callReasoningEngineStream("streaming_agent_run_with_events", { user_id: uid, request_json });
});
