import { onCall } from "firebase-functions/v2/https";
import { callReasoningEngine } from "../common/adk";
import { ENFORCE_APP_CHECK, REPLAY_PROTECTED } from "../common/config";

/**
 * List sessions for the given user.
 */
export const async_list_sessions = onCall({
  timeoutSeconds: 3600,
  enforceAppCheck: ENFORCE_APP_CHECK,
  consumeAppCheckToken: REPLAY_PROTECTED,
}, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new Error("Unauthorized");
  }
  console.log("Calling async_list_sessions for uid:", uid);
  const result = await callReasoningEngine("async_list_sessions", { user_id: uid }) as any;
  console.log("Reasoning Engine result:", JSON.stringify(result, null, 2));
  return result?.sessions || [];
});
