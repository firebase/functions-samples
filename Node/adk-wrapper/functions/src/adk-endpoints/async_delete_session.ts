import { onCall } from "firebase-functions/v2/https";
import { callReasoningEngine } from "../common/adk";
import { ENFORCE_APP_CHECK, REPLAY_PROTECTED } from "../common/config";

/**
 * Deletes a session for the given user.
 */
export const async_delete_session = onCall({
  timeoutSeconds: 3600,
  enforceAppCheck: ENFORCE_APP_CHECK,
  consumeAppCheckToken: REPLAY_PROTECTED,
}, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new Error("Unauthorized");
  }
  const { session_id } = request.data;
  return await callReasoningEngine("async_delete_session", { user_id: uid, session_id });
});
