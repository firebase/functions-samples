export const PROJECT_ID = process.env.GCLOUD_PROJECT || ""; // The google cloud project that contains your agent.
export const LOCATION = process.env.LOCATION || ""; // The location that your agent engine agent is deployed to.
export const REASONING_ENGINE_ID = process.env.REASONING_ENGINE_ID || ""; // The reasoning engine id for your agent.

export const ENFORCE_APP_CHECK = true;
export const REPLAY_PROTECTED = true;