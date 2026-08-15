import { onCall } from "firebase-functions/v2/https";
import { callReasoningEngineStream } from "../common/adk";
import { ENFORCE_APP_CHECK, REPLAY_PROTECTED } from "../common/config";

/**
 * Streams responses asynchronously from the ADK application.
 */
export const async_stream_query = onCall({
  timeoutSeconds: 3600,
  enforceAppCheck: ENFORCE_APP_CHECK,
  consumeAppCheckToken: REPLAY_PROTECTED,
}, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new Error("Unauthorized");
  }
  const { message, session_id, run_config } = request.data;
  return await callReasoningEngineStream("async_stream_query", { user_id: uid, message, session_id, run_config });
});
