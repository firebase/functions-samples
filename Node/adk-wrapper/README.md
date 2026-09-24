# Agent Engine (ADK) Wrapper Proxy

This sample demonstrates how to create a proxy between a client application and Google Cloud's Agent Engine using Firebase Cloud Functions. It allows secure access to agents built with the Agent Development Kit (ADK) from customer-facing applications.

## Why use a proxy?

Accessing Agent Engine directly from a client application requires service account credentials or user credentials with broad access, which is not secure for public-facing apps. This wrapper provides:

1.  **Authentication**: Automatically integrates with Firebase Authentication.
2.  **Security**: Enforces App Check to prevent abuse.
3.  **Encapsulation**: Hides specific Agent Engine IDs and project details from the client.

## Functions Code

See the [functions/src/adk-endpoints](functions/src/adk-endpoints) directory for the implementation of each endpoint.

All functions are implemented as **Callable Functions** (`onCall`). They automatically decode client data and verify user authentication tokens.

### How to call from your app (Client Example)

To call these functions from a client app (e.g., Web, iOS, Android), use the Firebase Functions SDK. Here is a generic example using the JS SDK:

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

// Example: Calling async_create_session
const asyncCreateSession = httpsCallable(functions, 'async_create_session');
try {
  const result = await asyncCreateSession();
  console.log('Session created:', result.data);
} catch (error) {
  console.error('Error creating session:', error);
}
```

### Callable Function Reference

Here are the available callable functions and how to call them with data.

#### `async_create_session`
Creates a new session for the authenticated user.
*   **Requires Auth**: Yes
*   **Input**: None (Uses the authenticated user's UID as `user_id`).
*   **Returns**: The created session object.

#### `async_delete_session`
Deletes a session for the authenticated user.
*   **Requires Auth**: Yes
*   **Input**: `{ session_id: string }`
*   **Returns**: The result from Agent Engine.

#### `async_get_session`
Retrieves details for a specific session.
*   **Requires Auth**: Yes
*   **Input**: `{ session_id: string }`
*   **Returns**: The session details.

#### `async_list_sessions`
Lists all sessions for the authenticated user.
*   **Requires Auth**: Yes
*   **Input**: None (Uses the authenticated user's UID to filter sessions).
*   **Returns**: An array of sessions.

#### `async_add_session_to_memory`
Adds a session to memory (generates memories).
*   **Requires Auth**: Yes
*   **Input**: `{ session: any }`
*   **Returns**: The result from Agent Engine.

#### `async_search_memory`
Searches memories for the given user.
*   **Requires Auth**: Yes
*   **Input**: `{ query: string }`
*   **Returns**: The search results.

#### `async_stream_query`
Streams responses asynchronously from the ADK application.
*   **Requires Auth**: Yes
*   **Input**: `{ message: string, session_id?: string, run_config?: any }`
*   **Returns**: An object containing the full response and chunks.

#### `streaming_agent_run_with_events`
Streams responses asynchronously from the ADK application, typically used by tools like AgentSpace.
*   **Requires Auth**: Yes
*   **Input**: `{ request_json: any }`
*   **Returns**: An object containing the full response and chunks.

## The `common` Folder & Configuration

The `functions/src/common` folder contains shared logic and configuration for all endpoints.

*   `adk.ts`: Contains helper functions `callReasoningEngine` and `callReasoningEngineStream` that use the `@google-cloud/aiplatform` SDK to communicate with Agent Engine.
*   `config.ts`: Defines the configuration options for the project.

### Configuration Options in `config.ts`

To use this wrapper, you need to configure it with your Google Cloud and Agent Engine details. You can do this by setting environment variables or editing the values directly in `config.ts`:

*   **`PROJECT_ID`**: The Google Cloud project ID containing your agent. Defaults to `process.env.GCLOUD_PROJECT`.
*   **`LOCATION`**: The region where your Agent Engine agent is deployed (e.g., `us-central1`). Defaults to `process.env.LOCATION`.
*   **`REASONING_ENGINE_ID`**: The unique ID of your reasoning engine instance. Defaults to `process.env.REASONING_ENGINE_ID`.
*   **`ENFORCE_APP_CHECK`**: Set to `true` to require Firebase App Check tokens for all requests. Hardcoded to `true` in this sample.
*   **`REPLAY_PROTECTED`**: Set to `true` to consume App Check tokens for replay protection. Hardcoded to `true` in this sample.

## Deploy and test

To set up the sample:

1.  Create a Firebase Project using the [Firebase Console](https://console.firebase.google.com).
2.  Enable Cloud Functions and Firebase Authentication.
3.  Deploy your ADK agent to Agent Engine and obtain the `REASONING_ENGINE_ID`.
4.  Clone this repository.
5.  Navigate to this sample directory: `cd Node/adk-wrapper`.
6.  Set up your project: `firebase use --add` and follow the instructions.
7.  Install dependencies: `cd functions; npm install; cd -`.
8.  Set environment variables or edit `functions/src/common/config.ts` with your values.
9.  Deploy the functions: `firebase deploy`.
