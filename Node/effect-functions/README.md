# Effect.ts with 2nd Gen Cloud Functions

This sample demonstrates how to build production-grade, type-safe Firebase 2nd Gen Cloud Functions using [Effect.ts](https://effect.website).

## What it demonstrates

- **2nd Gen Callable Function (`createTask`)**:
  - Request validation using `Schema.decodeUnknown` and `ParseResult.ArrayFormatter`.
  - Authentication verification with typed domain errors (`UnauthorizedError`).
  - Warm container reuse using a module-scoped `ManagedRuntime`.
  - Domain error mapping to standard `HttpsError` status codes, while logging unexpected defects with `Cause.pretty`.

- **2nd Gen Firestore Trigger (`onTaskWritten`)**:
  - Document snapshot parsing with `Schema`.
  - State machine transition validation (`InvalidTransitionError`).
  - Structured concurrency with `Effect.all` running independent operations concurrently.
  - Resilient retry policies with exponential backoff and jitter via `Schedule`.

- **Context & Layer Dependency Injection**:
  - Modular service architecture (`FirestoreService`, `TaskRepository`, `AuditRepository`, `UserStatsRepository`).
  - Custom `Logger` layer routing `Effect.logInfo`, `Effect.annotateLogs`, etc. straight into `firebase-functions/logger` with structured `jsonPayload` attributes.

- **Emulator Testing with Vitest**:
  - Local unit and integration tests using `firebase-functions-test` and Vitest running against the Firebase Local Emulator Suite.

## Prerequisites

- Node.js 20+
- [Firebase CLI](https://firebase.google.com/docs/cli) installed and logged in (`npm install -g firebase-tools`)
- Java Runtime Environment (JRE) for the Firebase Emulator Suite

## Setup

1. Navigate to the functions directory and install dependencies:

   ```bash
   cd functions
   npm install
   ```

2. Build the TypeScript source code:

   ```bash
   npm run build
   ```

## Running Tests

Run the test suite inside the Firebase Local Emulator Suite:

```bash
npm test
```

This starts the Firestore emulator, runs the Vitest test suite, and tears down the emulator automatically.

To run Vitest directly (if emulators are already running):

```bash
npm run test:unit
```

## Local Development & Emulators

Start the Firebase Emulator Suite for both Functions and Firestore:

```bash
npm run serve
```

## Deployment

Deploy the functions to your Firebase project:

```bash
npm run deploy
```
