/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, GrpcStatus } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { defineInt } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { Effect, Exit, Cause, Option, Predicate } from "effect";
import { appRuntime } from "./runtime";
import {
  TaskStatus,
  decodeCreateTaskInput,
  decodeTask,
} from "./domain/models";
import {
  DomainError,
  UnauthorizedError,
  ValidationError,
  InvalidTransitionError,
} from "./domain/errors";
import { TaskRepository } from "./services/task-repo";
import { UserStatsRepository } from "./services/user-stats-repo";

if (getApps().length === 0) {
  initializeApp();
}
const db = getFirestore();

/**
 * Parameterized configuration via `firebase-functions/params`.
 * Bounds the maximum number of active tasks a user can hold at once.
 */
export const maxActiveTasksPerUser = defineInt("MAX_ACTIVE_TASKS_PER_USER", {
  default: 100,
  description: "Maximum number of active tasks allowed per user",
});

const allowedTransitions: Record<TaskStatus, ReadonlyArray<TaskStatus>> = {
  todo: ["in_progress", "completed", "archived"],
  in_progress: ["completed", "todo", "archived"],
  completed: ["in_progress", "archived"],
  archived: [],
};

const isAlreadyExists = (cause: unknown): boolean =>
  Predicate.hasProperty(cause, "code") &&
  cause.code === GrpcStatus.ALREADY_EXISTS;

/**
 * Maps Effect Exit outcomes to Firebase HttpsErrors.
 * Expected domain errors in the failure channel are mapped to standard HttpsError codes
 * with exhaustive `switch (error._tag)` narrowing and zero type casts.
 * Unexpected defects (panics, fiber crashes) log full traces and return a safe internal error.
 */
export function handleCallableExit<A>(exit: Exit.Exit<A, DomainError>): A {
  if (Exit.isSuccess(exit)) {
    return exit.value;
  }

  const failureOpt = Cause.findErrorOption(exit.cause);
  if (Option.isSome(failureOpt)) {
    const error = failureOpt.value;
    switch (error._tag) {
      case "UnauthorizedError":
        throw new HttpsError("unauthenticated", error.message);
      case "ValidationError":
        throw new HttpsError("invalid-argument", error.message);
      case "InvalidTransitionError":
        throw new HttpsError(
          "failed-precondition",
          `Invalid status transition from '${error.from}' to '${error.to}': ${error.reason}`
        );
      case "FirestoreError":
        throw new HttpsError("internal", error.message);
    }
  }

  // Untyped defect (uncaught exception, crash, or panic)
  logger.write({
    severity: "ERROR",
    message: "Unhandled defect in callable function",
    cause: Cause.pretty(exit.cause),
  });
  throw new HttpsError("internal", "An internal error occurred.");
}

/**
 * Validates allowed state transitions for a task.
 */
export const validateStatusTransition = Effect.fn("validateStatusTransition")(
  function* (from: TaskStatus, to: TaskStatus) {
    if (from === to || allowedTransitions[from]?.includes(to)) {
      return;
    }

    return yield* new InvalidTransitionError({
      from,
      to,
      reason: `Cannot transition from '${from}' to '${to}'.`,
    });
  }
);

/**
 * 2nd Gen Callable Function: createTask
 *
 * Demonstrates:
 * - Request validation and decoding defaults via `Schema.decodeUnknownEffect` and `Schema.withDecodingDefault`
 * - Authentication verification with typed `UnauthorizedError` yielded directly
 * - Parameterized limits via `firebase-functions/params` (`defineInt`)
 * - Firestore repositories defined with `Context.Service` and `Layer.sync`
 * - `Effect.gen` + `Effect.fn` for traced effectful workflows
 * - Structured logging with `Effect.annotateLogs`, `Effect.withLogSpan`, and custom Cloud Logger layer
 * - `ManagedRuntime` execution with warm container reuse
 * - `Exit` / `Cause.findErrorOption` inspection mapping domain errors to `HttpsError`
 */
export const createTask = onCall({ cors: true }, async (request) => {
  const program = Effect.gen(function* () {
    // 1. Verify Authentication
    if (!request.auth) {
      return yield* new UnauthorizedError({
        message: "You must be signed in to create a task.",
      });
    }
    const userId = request.auth.uid;

    // 2. Validate input payload using pre-built Schema decoder
    const input = yield* decodeCreateTaskInput(request.data).pipe(
      Effect.mapError((err) => new ValidationError({ message: err.message }))
    );

    // 3. Enforce parameterized active task limit per user
    const maxActiveTasks = maxActiveTasksPerUser.value();
    const statsRepo = yield* UserStatsRepository;
    const currentStats = yield* statsRepo.getByUserId(userId);
    const activeTasks = Option.match(currentStats, {
      onNone: () => 0,
      onSome: (stats) => stats.activeTasks,
    });
    if (activeTasks >= maxActiveTasks) {
      return yield* new ValidationError({
        message: `User has reached the maximum of ${maxActiveTasks} active tasks`,
      });
    }

    yield* Effect.logInfo(`Creating new task "${input.title}"`);

    // 4. Persist to Firestore via injected TaskRepository
    const taskRepo = yield* TaskRepository;
    const task = yield* taskRepo.create({
      userId,
      data: input,
    });

    yield* Effect.logInfo(`Task created successfully with id ${task.id}`);

    return task;
  }).pipe(
    Effect.annotateLogs({
      userId: request.auth?.uid ?? "unauthenticated",
    }),
    Effect.withLogSpan("createTask")
  );

  const exit = await appRuntime.runPromiseExit(program);
  return handleCallableExit(exit);
});

/**
 * 2nd Gen Firestore Trigger: onTaskWritten
 *
 * Demonstrates:
 * - Document snapshot parsing via `Schema.decodeUnknownEffect`
 * - State machine validation via `Effect.fn` and typed `InvalidTransitionError` (logged and swallowed via `Effect.catchTag` to avoid infinite Eventarc retries)
 * - Atomic idempotent audit logging and user stats updates via `WriteBatch.create()` keyed by Eventarc `event.id` (`audit_logs/{event.id}`)
 * - Authoritative Eventarc CloudEvent timestamps via `event.time`
 */
export const onTaskWritten = onDocumentWritten(
  "tasks/{taskId}",
  async (event) => {
    const taskId = event.params.taskId;
    const beforeSnap = event.data?.before;
    const afterSnap = event.data?.after;

    const program = Effect.gen(function* () {
      const before = beforeSnap?.exists
        ? yield* decodeTask(beforeSnap.data())
        : undefined;
      const after = afterSnap?.exists
        ? yield* decodeTask(afterSnap.data())
        : undefined;
      const task = after ?? before;
      if (!task || (before && after && before.status === after.status)) {
        return; // no-op write
      }

      if (before && after) {
        yield* validateStatusTransition(before.status, after.status);
      }

      const action = !before
        ? "created"
        : !after
          ? "deleted"
          : "status_changed";
      const details = !before
        ? { title: task.title, priority: task.priority }
        : !after
          ? { title: task.title }
          : { from: before.status, to: after.status };

      // How a task in a given status contributes to the user's counters.
      const counts = (s?: TaskStatus) => ({
        active: s === "todo" || s === "in_progress" ? 1 : 0,
        completed: s === "completed" ? 1 : 0,
      });
      const activeDelta =
        counts(after?.status).active - counts(before?.status).active;
      const completedDelta =
        counts(after?.status).completed - counts(before?.status).completed;

      const batch = db.batch();
      batch.create(db.collection("audit_logs").doc(event.id), {
        id: event.id,
        taskId,
        userId: task.userId,
        action,
        details,
        timestamp: event.time,
      });
      if (activeDelta !== 0 || completedDelta !== 0) {
        batch.set(
          db.collection("user_stats").doc(task.userId),
          {
            userId: task.userId,
            activeTasks: FieldValue.increment(activeDelta),
            completedTasks: FieldValue.increment(completedDelta),
            lastUpdated: new Date().toISOString(),
          },
          { merge: true }
        );
      }
      const applied = yield* Effect.tryPromise({
        try: () => batch.commit(),
        catch: (e) => e,
      }).pipe(
        Effect.as(true),
        Effect.catchIf(isAlreadyExists, () => Effect.succeed(false)), // Eventarc redelivery
        Effect.orDie
      );
      yield* Effect.logInfo(
        applied ? `Recorded ${action}` : `Duplicate ${action} event ignored`
      );
    }).pipe(
      Effect.catchTag("InvalidTransitionError", (e) =>
        Effect.logWarning(
          `Ignoring invalid status transition from '${e.from}' to '${e.to}': ${e.reason}`
        )
      ),
      Effect.annotateLogs({
        taskId,
        eventId: event.id,
      }),
      Effect.withLogSpan("onTaskWritten")
    );

    const exit = await appRuntime.runPromiseExit(program);
    if (Exit.isFailure(exit)) {
      logger.write({
        severity: "ERROR",
        message: "Failed processing onTaskWritten trigger",
        cause: Cause.pretty(exit.cause),
      });
      throw new Error("Trigger processing failed");
    }
  }
);
