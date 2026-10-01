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

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import { randomUUID } from "node:crypto";
import { Effect, Exit, Cause, Option, Schema, ParseResult, Schedule, Duration } from "effect";
import { appRuntime } from "./runtime";
import { CreateTaskInput, Task, TaskStatus } from "./domain/models";
import {
  UnauthorizedError,
  ValidationError,
  TaskNotFoundError,
  InvalidTransitionError,
  FirestoreError,
} from "./domain/errors";
import { TaskRepository } from "./services/task-repo";
import { AuditRepository } from "./services/audit-repo";
import { UserStatsRepository } from "./services/user-stats-repo";

/**
 * Maps Effect Exit outcomes to Firebase HttpsErrors.
 * Expected domain errors in the failure channel are mapped to standard HttpsError codes.
 * Unexpected defects (panics, fiber crashes) log full traces and return a safe internal error.
 */
function handleCallableExit<A>(exit: Exit.Exit<A, unknown>): A {
  if (Exit.isSuccess(exit)) {
    return exit.value;
  }

  const failureOpt = Cause.failureOption(exit.cause);
  if (Option.isSome(failureOpt)) {
    const error = failureOpt.value;
    if (typeof error === "object" && error !== null && "_tag" in error) {
      switch ((error as { readonly _tag: string })._tag) {
        case "UnauthorizedError":
          throw new HttpsError("unauthenticated", (error as UnauthorizedError).message);
        case "ValidationError":
          throw new HttpsError("invalid-argument", (error as ValidationError).issues.join("; "));
        case "TaskNotFoundError":
          throw new HttpsError("not-found", `Task ${(error as TaskNotFoundError).id} was not found`);
        case "InvalidTransitionError":
          throw new HttpsError(
            "failed-precondition",
            `Invalid status transition from '${(error as InvalidTransitionError).from}' to '${(error as InvalidTransitionError).to}': ${(error as InvalidTransitionError).reason}`
          );
        case "FirestoreError":
          throw new HttpsError("internal", (error as FirestoreError).message);
      }
    }
  }

  // Untyped defect (uncaught exception, crash, or panic)
  logger.error("Unhandled defect in callable function:", Cause.pretty(exit.cause));
  throw new HttpsError("internal", "An internal error occurred.");
}

/**
 * Validates allowed state transitions for a task.
 */
function validateStatusTransition(
  from: TaskStatus,
  to: TaskStatus
): Effect.Effect<void, InvalidTransitionError> {
  const allowedTransitions: Record<TaskStatus, ReadonlyArray<TaskStatus>> = {
    todo: ["in_progress", "completed", "archived"],
    in_progress: ["completed", "todo", "archived"],
    completed: ["in_progress", "archived"],
    archived: [],
  };

  if (from === to) {
    return Effect.void;
  }

  if (allowedTransitions[from]?.includes(to)) {
    return Effect.void;
  }

  return Effect.fail(
    new InvalidTransitionError({
      from,
      to,
      reason: `Cannot transition from '${from}' to '${to}'.`,
    })
  );
}

/**
 * 2nd Gen Callable Function: createTask
 *
 * Demonstrates:
 * - Request validation via Schema.decodeUnknown with ArrayFormatter
 * - Authentication verification with typed UnauthorizedError
 * - Effect.gen for sequential effectful workflows
 * - Structured logging with Effect.annotateLogs and custom Cloud Logger layer
 * - ManagedRuntime execution with warm container reuse
 * - Exit / Cause inspection mapping domain errors to HttpsError
 */
export const createTask = onCall({ cors: true }, async (request) => {
  const program = Effect.gen(function* () {
    // 1. Verify Authentication
    if (!request.auth) {
      return yield* Effect.fail(
        new UnauthorizedError({ message: "You must be signed in to create a task." })
      );
    }
    const userId = request.auth.uid;

    // 2. Validate input payload using Schema
    const input = yield* Schema.decodeUnknown(CreateTaskInput)(request.data).pipe(
      Effect.mapError(
        (err) =>
          new ValidationError({
            issues: ParseResult.ArrayFormatter.formatErrorSync(err).map(
              (issue) => `${issue.path.join(".")}: ${issue.message}`
            ),
          })
      )
    );

    const taskId = randomUUID();

    yield* Effect.logInfo(`Creating new task "${input.title}"`);

    // 3. Persist to Firestore via injected TaskRepository
    const taskRepo = yield* TaskRepository;
    const task = yield* taskRepo.create({
      id: taskId,
      userId,
      data: input,
    });

    yield* Effect.logInfo(`Task created successfully with id ${taskId}`);

    return task;
  }).pipe(
    Effect.annotateLogs({
      userId: request.auth?.uid ?? "unauthenticated",
    })
  );

  const exit = await appRuntime.runPromiseExit(program);
  return handleCallableExit(exit);
});

/**
 * 2nd Gen Firestore Trigger: onTaskWritten
 *
 * Demonstrates:
 * - Document snapshot parsing via Schema
 * - State machine validation via typed InvalidTransitionError
 * - Structured concurrency with Effect.all running independent operations concurrently
 * - Resilient retries with exponential backoff and jitter via Schedule
 * - Structured log annotation and execution logging
 */
export const onTaskWritten = onDocumentWritten("tasks/{taskId}", async (event) => {
  const taskId = event.params.taskId;
  const beforeSnap = event.data?.before;
  const afterSnap = event.data?.after;

  const retryPolicy = Schedule.exponential(Duration.millis(100)).pipe(
    Schedule.jittered,
    Schedule.compose(Schedule.recurs(3))
  );

  const program = Effect.gen(function* () {
    const auditRepo = yield* AuditRepository;
    const statsRepo = yield* UserStatsRepository;

    // Case 1: Task Created
    if (!beforeSnap?.exists && afterSnap?.exists) {
      const task = yield* Schema.decodeUnknown(Task)(afterSnap.data()).pipe(
        Effect.mapError(
          (err) =>
            new FirestoreError({
              cause: err,
              message: `Failed to decode created task document for ${taskId}`,
            })
        )
      );

      yield* Effect.logInfo("Processing newly created task");

      // Run audit record and user stats increment concurrently with retries
      yield* Effect.all(
        [
          auditRepo.record({
            id: randomUUID(),
            taskId,
            userId: task.userId,
            action: "created",
            details: { title: task.title, priority: task.priority },
            timestamp: new Date().toISOString(),
          }).pipe(Effect.retry(retryPolicy)),

          statsRepo.onTaskCreated(task.userId).pipe(Effect.retry(retryPolicy)),
        ],
        { concurrency: "unbounded" }
      );

      yield* Effect.logInfo("Audit log and stats recorded for task creation");
      return;
    }

    // Case 2: Task Updated
    if (beforeSnap?.exists && afterSnap?.exists) {
      const beforeTask = yield* Schema.decodeUnknown(Task)(beforeSnap.data()).pipe(
        Effect.mapError(
          (err) =>
            new FirestoreError({
              cause: err,
              message: `Failed to decode 'before' task snapshot for ${taskId}`,
            })
        )
      );
      const afterTask = yield* Schema.decodeUnknown(Task)(afterSnap.data()).pipe(
        Effect.mapError(
          (err) =>
            new FirestoreError({
              cause: err,
              message: `Failed to decode 'after' task snapshot for ${taskId}`,
            })
        )
      );

      if (beforeTask.status !== afterTask.status) {
        yield* Effect.logInfo(
          `Task status transition detected: ${beforeTask.status} -> ${afterTask.status}`
        );

        // Validate allowed state transition
        yield* validateStatusTransition(beforeTask.status, afterTask.status);

        // Determine stats update effect based on transition
        let statsEffect: Effect.Effect<void, FirestoreError> = Effect.void;
        if (afterTask.status === "completed") {
          statsEffect = statsRepo.onTaskCompleted(afterTask.userId);
        } else if (beforeTask.status === "completed") {
          statsEffect = statsRepo.onTaskReopened(afterTask.userId);
        }

        // Run audit logging and user statistics update concurrently with retries
        yield* Effect.all(
          [
            auditRepo.record({
              id: randomUUID(),
              taskId,
              userId: afterTask.userId,
              action: "status_changed",
              details: { from: beforeTask.status, to: afterTask.status },
              timestamp: new Date().toISOString(),
            }).pipe(Effect.retry(retryPolicy)),

            statsEffect.pipe(Effect.retry(retryPolicy)),
          ],
          { concurrency: "unbounded" }
        );

        yield* Effect.logInfo("Status change processed and audited");
      }
      return;
    }

    // Case 3: Task Deleted
    if (beforeSnap?.exists && !afterSnap?.exists) {
      const beforeTask = yield* Schema.decodeUnknown(Task)(beforeSnap.data()).pipe(
        Effect.mapError(
          (err) =>
            new FirestoreError({
              cause: err,
              message: `Failed to decode deleted task snapshot for ${taskId}`,
            })
        )
      );

      yield* Effect.logInfo("Processing deleted task");

      yield* Effect.all(
        [
          auditRepo.record({
            id: randomUUID(),
            taskId,
            userId: beforeTask.userId,
            action: "deleted",
            details: { title: beforeTask.title },
            timestamp: new Date().toISOString(),
          }).pipe(Effect.retry(retryPolicy)),

          statsRepo
            .onTaskDeleted(beforeTask.userId, beforeTask.status === "completed")
            .pipe(Effect.retry(retryPolicy)),
        ],
        { concurrency: "unbounded" }
      );

      yield* Effect.logInfo("Deletion audit log and stats updated");
    }
  }).pipe(
    Effect.annotateLogs({
      taskId,
      eventId: event.id,
    })
  );

  const exit = await appRuntime.runPromiseExit(program);
  if (Exit.isFailure(exit)) {
    logger.error("Failed processing onTaskWritten trigger:", Cause.pretty(exit.cause));
    throw new Error("Trigger processing failed");
  }
});
