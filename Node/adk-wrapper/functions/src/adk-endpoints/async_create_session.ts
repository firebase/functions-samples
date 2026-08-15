import { onCall } from "firebase-functions/v2/https";
import { callReasoningEngine } from "../common/adk";
import { ENFORCE_APP_CHECK, REPLAY_PROTECTED } from "../common/config";

/**
 * Creates a new session.
 */
export const async_create_session = onCall({
  timeoutSeconds: 3600,
  enforceAppCheck: ENFORCE_APP_CHECK,
  consumeAppCheckToken: REPLAY_PROTECTED,
}, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new Error("Unauthorized");
  }
  return await callReasoningEngine("async_create_session", { user_id: uid });
});
