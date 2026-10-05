# Effect.ts (v4) with 2nd Gen Cloud Functions

This sample demonstrates how to build production-grade, type-safe Firebase 2nd Gen Cloud Functions using [Effect 4](https://effect.website) (`effect@^4.0.0`).

## What it demonstrates

- **2nd Gen Callable Function (`createTask`)**:
  - Request validation and decoding defaults using `Schema.decodeUnknownEffect` and `Schema.withDecodingDefault`.
  - Authentication verification and domain error modeling with `Schema.TaggedError` (yielded directly in `Effect.gen` / `Effect.fn` without `Effect.fail`).
  - Parameterized configuration via `firebase-functions/params` (`defineInt`) enforcing per-user active task limits.
  - Native Firestore auto-IDs (`collection.doc()`) and explicit `Schema.decodeUnknownEffect` validation on repository reads.
  - Warm container reuse using a module-scoped `ManagedRuntime`.
  - Exhaustive domain error mapping to `HttpsError` status codes via `Cause.findErrorOption`, while logging unexpected defects with `Cause.pretty`.

- **2nd Gen Firestore Trigger (`onTaskWritten`)**:
  - Document snapshot parsing with `Schema.decodeUnknownEffect`.
  - Traced state machine transition validation (`Effect.fn("validateStatusTransition")` + `InvalidTransitionError`), caught with `Effect.catchTag` and logged as a warning so Eventarc does not retry invalid transitions.
  - Atomic idempotent audit log persistence and user stats updates via `WriteBatch.create()` keyed on `audit_logs/{event.id}`, catching `ALREADY_EXISTS` with `Effect.catchIf` so duplicate Eventarc deliveries execute stats mutations at most once without round-trip reads or transactions.
  - Authoritative Eventarc CloudEvent timestamps via `event.time`.

- **`Context.Service` & `Layer` Dependency Injection**:
  - Firestore repositories (`TaskRepository`, `UserStatsRepository`) defined with `Context.Service` and static `layer` definitions (`Layer.sync`), composed via `Layer.mergeAll`.
  - Custom `Logger` layer built on `Logger.formatStructured` and `Logger.layer`, routing `Effect.logInfo`, `Effect.logWarning`, `Effect.annotateLogs`, and `Effect.withLogSpan` directly into `firebase-functions/logger` (`logger.write`) with structured `jsonPayload` attributes.

- **Emulator Testing with Vitest**:
  - Integration tests using `firebase-functions-test` and Vitest running against the Firebase Local Emulator Suite.

## Prerequisites

- Node.js 20+
- [Firebase CLI](https://firebase.google.com/docs/cli) installed (`npm install -g firebase-tools`)
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

Run the test suite inside the Firebase Local Emulator Suite (starts the Firestore emulator, runs Vitest, and tears down the emulator automatically):

```bash
npm test
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
