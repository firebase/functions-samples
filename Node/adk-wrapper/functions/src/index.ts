/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions";

setGlobalOptions({ maxInstances: 10 });

export * from "./adk-endpoints/async_get_session";
export * from "./adk-endpoints/async_list_sessions";
export * from "./adk-endpoints/async_create_session";
export * from "./adk-endpoints/async_delete_session";
export * from "./adk-endpoints/async_add_session_to_memory";
export * from "./adk-endpoints/async_search_memory";
export * from "./adk-endpoints/async_stream_query";
export * from "./adk-endpoints/streaming_agent_run_with_events";