import { onCall } from "firebase-functions/v2/https";
import { callReasoningEngine } from "../common/adk";
import { ENFORCE_APP_CHECK, REPLAY_PROTECTED } from "../common/config";

/**
 * Generates memories.
 */
export const async_add_session_to_memory = onCall({
  timeoutSeconds: 3600,
  enforceAppCheck: ENFORCE_APP_CHECK,
  consumeAppCheckToken: REPLAY_PROTECTED,
}, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new Error("Unauthorized");
  }
  const { session } = request.data;
  return await callReasoningEngine("async_add_session_to_memory", { user_id: uid, session });
});
