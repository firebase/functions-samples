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

process.env.GCLOUD_PROJECT = "demo-effect-functions";

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as admin from "firebase-admin";
import { getApps, initializeApp } from "firebase-admin/app";
import * as firestoreModule from "firebase-admin/firestore";
import { Change } from "firebase-functions/v2";
import firebaseFunctionsTest from "firebase-functions-test";
import { Effect, Exit, Option, Predicate } from "effect";
import {
  createTask,
  onTaskWritten,
  handleCallableExit,
  retryPolicy,
} from "../index";
import { appRuntime } from "../runtime";
import { TaskRepository } from "../services/task-repo";
import { UserStatsRepository } from "../services/user-stats-repo";
import { FirestoreError, TaskNotFoundError } from "../domain/errors";

const { getFirestore } = firestoreModule;

// Compatibility shim for firebase-functions-test with firebase-admin v14
if (!Predicate.isFunction((admin as Record<string, unknown>).firestore)) {
  (admin as Record<string, unknown>).firestore = Object.assign(
    firestoreModule.getFirestore,
    firestoreModule
  );
}

const fft = firebaseFunctionsTest({
  projectId: "demo-effect-functions",
});

function installInMemoryFirestoreFallback(db: firestoreModule.Firestore): void {
  const store = new Map<string, Map<string, Record<string, unknown>>>();

  const getColMap = (name: string): Map<string, Record<string, unknown>> => {
    let col = store.get(name);
    if (!col) {
      col = new Map();
      store.set(name, col);
    }
    return col;
  };

  const makeQuery = (
    colMap: Map<string, Record<string, unknown>>,
    filters: ReadonlyArray<{ field: string; value: unknown }> = []
  ): Record<string, unknown> => ({
    where: (field: string, _op: string, value: unknown) =>
      makeQuery(colMap, [...filters, { field, value }]),
    get: async () => {
      const docs = Array.from(colMap.values()).filter((doc) =>
        filters.every((f) => doc[f.field] === f.value)
      );
      return {
        empty: docs.length === 0,
        docs: docs.map((d) => ({ exists: true, data: () => ({ ...d }) })),
      };
    },
  });

  (db as unknown as Record<string, unknown>).collection = (name: string) => {
    const colMap = getColMap(name);
    return {
      ...makeQuery(colMap),
      doc: (id: string) => ({
        get: async () => {
          const existing = colMap.get(id);
          return {
            exists: existing !== undefined,
            data: () => (existing ? { ...existing } : undefined),
          };
        },
        set: async (
          data: Record<string, unknown>,
          options?: { merge?: boolean }
        ) => {
          const prev = options?.merge ? (colMap.get(id) ?? {}) : {};
          const next: Record<string, unknown> = { ...prev };
          for (const [k, v] of Object.entries(data)) {
            if (
              Predicate.hasProperty(v, "operand") &&
              Predicate.isNumber(v.operand)
            ) {
              const current = Predicate.isNumber(next[k]) ? next[k] : 0;
              next[k] = current + v.operand;
            } else {
              next[k] = v;
            }
          }
          colMap.set(id, next);
        },
        delete: async () => {
          colMap.delete(id);
        },
      }),
    };
  };
}

describe("Effect Cloud Functions", () => {
  beforeAll(() => {
    if (!getApps().some((app) => app.name === "[DEFAULT]")) {
      initializeApp({ projectId: "demo-effect-functions" });
    }
    if (!process.env.FIRESTORE_EMULATOR_HOST) {
      installInMemoryFirestoreFallback(getFirestore());
    }
  });

  afterAll(async () => {
    await appRuntime.dispose();
    fft.cleanup();
  });

  describe("createTask (onCall)", () => {
    const wrappedCreateTask = fft.wrap(createTask);

    it("rejects unauthenticated requests with unauthenticated error", async () => {
      await expect(
        wrappedCreateTask({
          data: { title: "Test task" },
          auth: undefined,
        } as any)
      ).rejects.toThrowError(
        expect.objectContaining({
          code: "unauthenticated",
          message: "You must be signed in to create a task.",
        })
      );
    });

    it("rejects invalid input schema (empty title) with invalid-argument error", async () => {
      await expect(
        wrappedCreateTask({
          data: { title: "   " },
          auth: { uid: "user-123" },
        } as any)
      ).rejects.toThrowError(
        expect.objectContaining({
          code: "invalid-argument",
          message: expect.stringContaining("title:"),
        })
      );
    });

    it("creates a task when authenticated and payload is valid", async () => {
      const result = await wrappedCreateTask({
        data: {
          title: "Complete Effect.ts sample",
          description: "Build 2nd gen functions with Effect",
          priority: "high",
        },
        auth: { uid: "user-123" },
      } as any);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toBe("Complete Effect.ts sample");
      expect(result.description).toBe("Build 2nd gen functions with Effect");
      expect(result.priority).toBe("high");
      expect(result.status).toBe("todo");
      expect(result.userId).toBe("user-123");

      const db = getFirestore();
      const docSnap = await db.collection("tasks").doc(result.id).get();
      expect(docSnap.exists).toBe(true);
      expect(docSnap.data()?.title).toBe("Complete Effect.ts sample");
    });

    it("applies Schema.withDecodingDefault when optional fields (description, priority) are omitted", async () => {
      const result = await wrappedCreateTask({
        data: {
          title: "Task with decoding defaults",
        },
        auth: { uid: "user-defaults-123" },
      } as any);

      expect(result).toBeDefined();
      expect(result.title).toBe("Task with decoding defaults");
      expect(result.description).toBe("");
      expect(result.priority).toBe("medium");
      expect(result.status).toBe("todo");
      expect(result.userId).toBe("user-defaults-123");

      const db = getFirestore();
      const docSnap = await db.collection("tasks").doc(result.id).get();
      expect(docSnap.exists).toBe(true);
      expect(docSnap.data()?.description).toBe("");
      expect(docSnap.data()?.priority).toBe("medium");
    });

    it("enforces MAX_ACTIVE_TASKS_PER_USER parameter limit", async () => {
      const db = getFirestore();
      const limitedUserId = "user-limit-test";
      await db.collection("user_stats").doc(limitedUserId).set({
        userId: limitedUserId,
        activeTasks: 2,
        completedTasks: 0,
        lastUpdated: new Date().toISOString(),
      });

      const previousLimit = process.env.MAX_ACTIVE_TASKS_PER_USER;
      process.env.MAX_ACTIVE_TASKS_PER_USER = "2";
      try {
        await expect(
          wrappedCreateTask({
            data: { title: "Exceeds limit" },
            auth: { uid: limitedUserId },
          } as any)
        ).rejects.toThrowError(
          expect.objectContaining({
            code: "invalid-argument",
            message: expect.stringContaining("maximum of 2 active tasks"),
          })
        );

        // Verify MAX_ACTIVE_TASKS_PER_USER = 0 boundary (even for a user without a stats doc)
        process.env.MAX_ACTIVE_TASKS_PER_USER = "0";
        await expect(
          wrappedCreateTask({
            data: { title: "Blocked when limit is zero" },
            auth: { uid: "brand-new-user-zero-limit" },
          } as any)
        ).rejects.toThrowError(
          expect.objectContaining({
            code: "invalid-argument",
            message: expect.stringContaining("maximum of 0 active tasks"),
          })
        );
      } finally {
        if (previousLimit === undefined) {
          delete process.env.MAX_ACTIVE_TASKS_PER_USER;
        } else {
          process.env.MAX_ACTIVE_TASKS_PER_USER = previousLimit;
        }
      }
    });
  });

  describe("onTaskWritten (onDocumentWritten)", () => {
    const wrappedOnTaskWritten = fft.wrap(onTaskWritten);

    it("processes task creation: records idempotent audit log and updates user stats", async () => {
      const taskId = "task-created-1";
      const userId = "user-abc";
      const taskData = {
        id: taskId,
        userId,
        title: "Test task creation",
        description: "",
        priority: "medium",
        status: "todo",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const beforeSnap = fft.firestore.makeDocumentSnapshot({}, `tasks/${taskId}`);
      const afterSnap = fft.firestore.makeDocumentSnapshot(taskData, `tasks/${taskId}`);
      const event = {
        params: { taskId },
        id: "event-create-1",
        data: new Change(beforeSnap, afterSnap),
      };

      await wrappedOnTaskWritten(event);

      const db = getFirestore();
      const statsSnap = await db.collection("user_stats").doc(userId).get();
      expect(statsSnap.exists).toBe(true);
      expect(statsSnap.data()?.activeTasks).toBeGreaterThanOrEqual(1);

      const auditDoc = await db.collection("audit_logs").doc("event-create-1").get();
      expect(auditDoc.exists).toBe(true);
      expect(auditDoc.data()?.taskId).toBe(taskId);
      expect(auditDoc.data()?.action).toBe("created");
    });

    it("processes valid status transition: updates stats and logs status change", async () => {
      const taskId = "task-status-1";
      const userId = "user-abc";
      const beforeData = {
        id: taskId,
        userId,
        title: "Test status transition",
        description: "",
        priority: "medium",
        status: "todo",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const afterData = {
        ...beforeData,
        status: "completed",
        updatedAt: new Date().toISOString(),
      };

      const beforeSnap = fft.firestore.makeDocumentSnapshot(beforeData, `tasks/${taskId}`);
      const afterSnap = fft.firestore.makeDocumentSnapshot(afterData, `tasks/${taskId}`);

      const event = {
        params: { taskId },
        id: "event-status-1",
        data: new Change(beforeSnap, afterSnap),
      };

      await wrappedOnTaskWritten(event);

      const db = getFirestore();
      const statsSnap = await db.collection("user_stats").doc(userId).get();
      expect(statsSnap.exists).toBe(true);
      expect(statsSnap.data()?.completedTasks).toBeGreaterThanOrEqual(1);

      const auditSnaps = await db
        .collection("audit_logs")
        .where("taskId", "==", taskId)
        .where("action", "==", "status_changed")
        .get();
      expect(auditSnaps.empty).toBe(false);
    });

    it("processes archiving transition: decrements completedTasks when archiving a completed task", async () => {
      const taskId = "task-archive-1";
      const userId = "user-archive-stats";
      const now = new Date().toISOString();

      const db = getFirestore();
      await db.collection("user_stats").doc(userId).set({
        userId,
        activeTasks: 1,
        completedTasks: 2,
        lastUpdated: now,
      });

      const beforeData = {
        id: taskId,
        userId,
        title: "Task to archive",
        description: "",
        priority: "medium",
        status: "completed",
        createdAt: now,
        updatedAt: now,
      };
      const afterData = {
        ...beforeData,
        status: "archived",
        updatedAt: now,
      };

      const beforeSnap = fft.firestore.makeDocumentSnapshot(beforeData, `tasks/${taskId}`);
      const afterSnap = fft.firestore.makeDocumentSnapshot(afterData, `tasks/${taskId}`);

      const event = {
        params: { taskId },
        id: "event-archive-1",
        data: new Change(beforeSnap, afterSnap),
      };

      await wrappedOnTaskWritten(event);

      const statsSnap = await db.collection("user_stats").doc(userId).get();
      expect(statsSnap.exists).toBe(true);
      expect(statsSnap.data()?.activeTasks).toBe(1);
      expect(statsSnap.data()?.completedTasks).toBe(1);
    });

    it("rejects invalid status transition (archived to todo)", async () => {
      const taskId = "task-invalid-1";
      const userId = "user-abc";
      const beforeData = {
        id: taskId,
        userId,
        title: "Test invalid transition",
        description: "",
        priority: "low",
        status: "archived",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const afterData = {
        ...beforeData,
        status: "todo",
        updatedAt: new Date().toISOString(),
      };

      const beforeSnap = fft.firestore.makeDocumentSnapshot(beforeData, `tasks/${taskId}`);
      const afterSnap = fft.firestore.makeDocumentSnapshot(afterData, `tasks/${taskId}`);

      const event = {
        params: { taskId },
        id: "event-invalid-1",
        data: new Change(beforeSnap, afterSnap),
      };

      await expect(wrappedOnTaskWritten(event)).rejects.toThrowError();
    });

    it("processes task deletion: decrements stats and logs deletion", async () => {
      const taskId = "task-delete-1";
      const userId = "user-abc";
      const beforeData = {
        id: taskId,
        userId,
        title: "Test task deletion",
        description: "",
        priority: "low",
        status: "todo",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const beforeSnap = fft.firestore.makeDocumentSnapshot(beforeData, `tasks/${taskId}`);
      const afterSnap = fft.firestore.makeDocumentSnapshot({}, `tasks/${taskId}`);

      const event = {
        params: { taskId },
        id: "event-delete-1",
        data: new Change(beforeSnap, afterSnap),
      };

      await wrappedOnTaskWritten(event);

      const db = getFirestore();
      const auditSnaps = await db
        .collection("audit_logs")
        .where("taskId", "==", taskId)
        .where("action", "==", "deleted")
        .get();
      expect(auditSnaps.empty).toBe(false);
    });

    it("handles reopening and deleting archived tasks without corrupting user stats", async () => {
      const db = getFirestore();
      const userId = "user-edge-stats";
      const now = new Date().toISOString();
      await db.collection("user_stats").doc(userId).set({
        userId,
        activeTasks: 1,
        completedTasks: 1,
        lastUpdated: now,
      });

      // 1. Reopen completed task (completed -> in_progress): activeTasks 2, completedTasks 0
      const taskId = "task-reopen-1";
      const completedSnap = fft.firestore.makeDocumentSnapshot(
        {
          id: taskId,
          userId,
          title: "Reopen me",
          description: "",
          priority: "high",
          status: "completed",
          createdAt: now,
          updatedAt: now,
        },
        `tasks/${taskId}`
      );
      const inProgressSnap = fft.firestore.makeDocumentSnapshot(
        {
          id: taskId,
          userId,
          title: "Reopen me",
          description: "",
          priority: "high",
          status: "in_progress",
          createdAt: now,
          updatedAt: now,
        },
        `tasks/${taskId}`
      );
      await wrappedOnTaskWritten({
        params: { taskId },
        id: "event-reopen-1",
        data: new Change(completedSnap, inProgressSnap),
      });

      let statsSnap = await db.collection("user_stats").doc(userId).get();
      expect(statsSnap.data()?.activeTasks).toBe(2);
      expect(statsSnap.data()?.completedTasks).toBe(0);

      // 2. Archive active task (in_progress -> archived): activeTasks 1, completedTasks 0
      const archivedSnap = fft.firestore.makeDocumentSnapshot(
        {
          id: taskId,
          userId,
          title: "Reopen me",
          description: "",
          priority: "high",
          status: "archived",
          createdAt: now,
          updatedAt: now,
        },
        `tasks/${taskId}`
      );
      await wrappedOnTaskWritten({
        params: { taskId },
        id: "event-archive-active-1",
        data: new Change(inProgressSnap, archivedSnap),
      });

      statsSnap = await db.collection("user_stats").doc(userId).get();
      expect(statsSnap.data()?.activeTasks).toBe(1);
      expect(statsSnap.data()?.completedTasks).toBe(0);

      // 3. Delete archived task (archived -> deleted): activeTasks 1, completedTasks 0
      const emptySnap = fft.firestore.makeDocumentSnapshot({}, `tasks/${taskId}`);
      await wrappedOnTaskWritten({
        params: { taskId },
        id: "event-delete-archived-1",
        data: new Change(archivedSnap, emptySnap),
      });

      statsSnap = await db.collection("user_stats").doc(userId).get();
      expect(statsSnap.data()?.activeTasks).toBe(1);
      expect(statsSnap.data()?.completedTasks).toBe(0);
    });
  });

  describe("TaskRepository service methods", () => {
    it("findById decodes valid tasks, returns Option.none for missing tasks, and deletes tasks", async () => {
      const taskId = "repo-test-task-1";
      const created = await appRuntime.runPromise(
        Effect.gen(function* () {
          const repo = yield* TaskRepository;
          return yield* repo.create({
            id: taskId,
            userId: "user-repo",
            data: {
              title: "Repository test",
              description: "Verify findById and delete",
              priority: "urgent",
            },
          });
        })
      );
      expect(created.id).toBe(taskId);

      const found = await appRuntime.runPromise(
        Effect.gen(function* () {
          const repo = yield* TaskRepository;
          return yield* repo.findById(taskId);
        })
      );
      expect(Option.isSome(found)).toBe(true);

      await appRuntime.runPromise(
        Effect.gen(function* () {
          const repo = yield* TaskRepository;
          yield* repo.delete(taskId);
        })
      );

      const afterDelete = await appRuntime.runPromise(
        Effect.gen(function* () {
          const repo = yield* TaskRepository;
          return yield* repo.findById(taskId);
        })
      );
      expect(Option.isNone(afterDelete)).toBe(true);
    });

    it("findById fails with FirestoreError when stored task document is corrupted", async () => {
      const db = getFirestore();
      const corruptedId = "repo-corrupted-task-1";
      await db.collection("tasks").doc(corruptedId).set({
        id: corruptedId,
        userId: "user-repo",
        title: "   ", // invalid NonEmptyTrimmedString
        status: "invalid-status",
      });

      const exit = await appRuntime.runPromiseExit(
        Effect.gen(function* () {
          const repo = yield* TaskRepository;
          return yield* repo.findById(corruptedId);
        })
      );
      expect(Exit.isFailure(exit)).toBe(true);
      await db.collection("tasks").doc(corruptedId).delete();
    });

    it("UserStatsRepository.onStatusChanged accurately updates counts for transitions from archived", async () => {
      const db = getFirestore();
      const userId = "user-unarchive-stats";
      await db.collection("user_stats").doc(userId).set({
        userId,
        activeTasks: 0,
        completedTasks: 0,
        lastUpdated: new Date().toISOString(),
      });

      await appRuntime.runPromise(
        Effect.gen(function* () {
          const statsRepo = yield* UserStatsRepository;
          yield* statsRepo.onStatusChanged(userId, "archived", "todo");
          yield* statsRepo.onStatusChanged(userId, "archived", "completed");
        })
      );

      const snap = await db.collection("user_stats").doc(userId).get();
      expect(snap.data()?.activeTasks).toBe(1);
      expect(snap.data()?.completedTasks).toBe(1);
    });

    it("retryPolicy retries transient failures up to 3 times and succeeds or fails after exhausting attempts", async () => {
      let attempts = 0;
      const recovered = await appRuntime.runPromise(
        Effect.gen(function* () {
          attempts += 1;
          if (attempts < 3) {
            return yield* new FirestoreError({
              cause: new Error("Transient unavailable"),
              message: "Firestore temporarily unavailable",
            });
          }
          return "ok";
        }).pipe(Effect.retry(retryPolicy))
      );
      expect(recovered).toBe("ok");
      expect(attempts).toBe(3);

      let exhaustedAttempts = 0;
      const exhaustedExit = await appRuntime.runPromiseExit(
        Effect.gen(function* () {
          exhaustedAttempts += 1;
          return yield* new FirestoreError({
            cause: new Error("Persistent failure"),
            message: "Firestore down",
          });
        }).pipe(Effect.retry(retryPolicy))
      );
      expect(Exit.isFailure(exhaustedExit)).toBe(true);
      // 1 initial attempt + 3 retries = 4 total evaluations
      expect(exhaustedAttempts).toBe(4);
    });

    it("handleCallableExit maps TaskNotFoundError, FirestoreError, and unhandled defects to HttpsError", () => {
      expect(() =>
        handleCallableExit(Exit.fail(new TaskNotFoundError({ id: "task-404" })))
      ).toThrowError(
        expect.objectContaining({
          code: "not-found",
          message: "Task task-404 was not found",
        })
      );

      expect(() =>
        handleCallableExit(
          Exit.fail(
            new FirestoreError({
              cause: new Error("unavailable"),
              message: "Database connection failed",
            })
          )
        )
      ).toThrowError(
        expect.objectContaining({
          code: "internal",
          message: "Database connection failed",
        })
      );

      expect(() =>
        handleCallableExit(Exit.die(new Error("Unexpected invariant crash")))
      ).toThrowError(
        expect.objectContaining({
          code: "internal",
          message: "An internal error occurred.",
        })
      );
    });
  });
});
