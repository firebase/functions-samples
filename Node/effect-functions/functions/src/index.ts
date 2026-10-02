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
import { defineInt } from "firebase-functions/params";
import { logger } from "firebase-functions";
import {
  Effect,
  Exit,
  Cause,
  Option,
  Predicate,
  SchemaIssue,
} from "effect";
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
  FirestoreError,
} from "./domain/errors";
import { TaskRepository } from "./services/task-repo";
import { AuditRepository } from "./services/audit-repo";
import { UserStatsRepository } from "./services/user-stats-repo";

/**
 * Parameterized configuration via `firebase-functions/params`.
 * Bounds the maximum number of active tasks a user can hold at once.
 */
export const maxActiveTasksPerUser = defineInt("MAX_ACTIVE_TASKS_PER_USER", {
  default: 100,
  description: "Maximum number of active tasks allowed per user",
});

const formatValidationIssue = SchemaIssue.makeFormatterStandardSchemaV1();

const allowedTransitions: Record<TaskStatus, ReadonlyArray<TaskStatus>> = {
  todo: ["in_progress", "completed", "archived"],
  in_progress: ["completed", "todo", "archived"],
  completed: ["in_progress", "archived"],
  archived: [],
};

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
        throw new HttpsError("invalid-argument", error.issues.join("; "));
      case "TaskNotFoundError":
        throw new HttpsError("not-found", `Task ${error.id} was not found`);
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
 * - Request validation via `Schema.decodeUnknownEffect` and `SchemaIssue.makeFormatterStandardSchemaV1`
 * - Authentication verification with typed `UnauthorizedError` yielded directly
 * - Parameterized limits via `firebase-functions/params` (`defineInt`)
 * - Firestore auto-IDs (`collection.doc()`) and Schema-backed `withConverter` repositories
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
      Effect.mapError(
        (err) =>
          new ValidationError({
            issues: formatValidationIssue(err.issue).issues.map((issue) => {
              const path =
                issue.path
                  ?.map((segment) =>
                    Predicate.hasProperty(segment, "key")
                      ? String(segment.key)
                      : String(segment)
                  )
                  .join(".") ?? "";
              return path ? `${path}: ${issue.message}` : issue.message;
            }),
          })
      )
    );

    // 3. Enforce parameterized active task limit per user
    const maxActiveTasks =
      process.env[maxActiveTasksPerUser.name] !== undefined
        ? maxActiveTasksPerUser.value()
        : 100;
    const statsRepo = yield* UserStatsRepository;
    const currentStats = yield* statsRepo.getByUserId(userId);
    const activeTasks = Option.match(currentStats, {
      onNone: () => 0,
      onSome: (stats) => stats.activeTasks,
    });
    if (activeTasks >= maxActiveTasks) {
      return yield* new ValidationError({
        issues: [
          `activeTasks: User has reached the maximum of ${maxActiveTasks} active tasks`,
        ],
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
 * - State machine validation via typed `InvalidTransitionError`
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
      const auditRepo = yield* AuditRepository;
      const statsRepo = yield* UserStatsRepository;

      // Case 1: Task Created
      if (!beforeSnap?.exists && afterSnap?.exists) {
        const task = yield* decodeTask(afterSnap.data()).pipe(
          Effect.mapError(
            (err) =>
              new FirestoreError({
                cause: err,
                message: `Failed to decode created task document for ${taskId}`,
              })
          )
        );

        yield* Effect.logInfo("Processing newly created task");

        const applied = yield* auditRepo.recordOnce(
          {
            id: event.id,
            taskId,
            userId: task.userId,
            action: "created",
            details: { title: task.title, priority: task.priority },
            timestamp: event.time,
          },
          (batch) => statsRepo.onTaskCreated(batch, task.userId)
        );

        if (applied) {
          yield* Effect.logInfo("Audit log and stats recorded for task creation");
        } else {
          yield* Effect.logInfo("Duplicate task creation event ignored");
        }
        return;
      }

      // Case 2: Task Updated
      if (beforeSnap?.exists && afterSnap?.exists) {
        const beforeTask = yield* decodeTask(beforeSnap.data()).pipe(
          Effect.mapError(
            (err) =>
              new FirestoreError({
                cause: err,
                message: `Failed to decode 'before' task snapshot for ${taskId}`,
              })
          )
        );
        const afterTask = yield* decodeTask(afterSnap.data()).pipe(
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

          const applied = yield* auditRepo.recordOnce(
            {
              id: event.id,
              taskId,
              userId: afterTask.userId,
              action: "status_changed",
              details: { from: beforeTask.status, to: afterTask.status },
              timestamp: event.time,
            },
            (batch) =>
              statsRepo.onStatusChanged(
                batch,
                afterTask.userId,
                beforeTask.status,
                afterTask.status
              )
          );

          if (applied) {
            yield* Effect.logInfo("Status change processed and audited");
          } else {
            yield* Effect.logInfo("Duplicate status change event ignored");
          }
        }
        return;
      }

      // Case 3: Task Deleted
      if (beforeSnap?.exists && !afterSnap?.exists) {
        const beforeTask = yield* decodeTask(beforeSnap.data()).pipe(
          Effect.mapError(
            (err) =>
              new FirestoreError({
                cause: err,
                message: `Failed to decode deleted task snapshot for ${taskId}`,
              })
          )
        );

        yield* Effect.logInfo("Processing deleted task");

        const applied = yield* auditRepo.recordOnce(
          {
            id: event.id,
            taskId,
            userId: beforeTask.userId,
            action: "deleted",
            details: { title: beforeTask.title },
            timestamp: event.time,
          },
          (batch) =>
            statsRepo.onTaskDeleted(batch, beforeTask.userId, beforeTask.status)
        );

        if (applied) {
          yield* Effect.logInfo("Deletion audit log and stats updated");
        } else {
          yield* Effect.logInfo("Duplicate task deletion event ignored");
        }
      }
    }).pipe(
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
