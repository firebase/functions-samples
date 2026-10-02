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
import { Cause, Effect, Exit, Option, Predicate } from "effect";
import {
  createTask,
  onTaskWritten,
  handleCallableExit,
} from "../index";
import { appRuntime } from "../runtime";
import { TaskRepository } from "../services/task-repo";
import { AuditRepository } from "../services/audit-repo";
import { UserStatsRepository } from "../services/user-stats-repo";
import { FirestoreError, TaskNotFoundError } from "../domain/errors";

const { getFirestore, GrpcStatus } = firestoreModule;

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

interface InMemoryDocRef {
  readonly id: string;
  readonly _key: string;
  readonly get: () => Promise<{
    readonly exists: boolean;
    readonly data: () => unknown;
  }>;
  readonly set: (
    data: Record<string, unknown>,
    options?: { merge?: boolean }
  ) => Promise<void>;
  readonly delete: () => Promise<void>;
  readonly _has: () => boolean;
  readonly _set: (
    data: Record<string, unknown>,
    options?: { merge?: boolean }
  ) => void;
}

function installInMemoryFirestoreFallback(db: firestoreModule.Firestore): void {
  const store = new Map<string, Map<string, Record<string, unknown>>>();
  let autoIdCounter = 0;

  const getColMap = (name: string): Map<string, Record<string, unknown>> => {
    let col = store.get(name);
    if (!col) {
      col = new Map();
      store.set(name, col);
    }
    return col;
  };

  const applySet = (
    colMap: Map<string, Record<string, unknown>>,
    id: string,
    data: Record<string, unknown>,
    options?: { merge?: boolean }
  ): void => {
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
  };

  const makeQuery = (
    colMap: Map<string, Record<string, unknown>>,
    filters: ReadonlyArray<{ field: string; value: unknown }> = [],
    converter?: firestoreModule.FirestoreDataConverter<unknown>
  ): Record<string, unknown> => ({
    where: (field: string, _op: string, value: unknown) =>
      makeQuery(colMap, [...filters, { field, value }], converter),
    get: async () => {
      const docs = Array.from(colMap.values()).filter((doc) =>
        filters.every((f) => doc[f.field] === f.value)
      );
      return {
        empty: docs.length === 0,
        docs: docs.map((d) => ({
          exists: true,
          data: () => {
            const raw = { ...d };
            return converter
              ? converter.fromFirestore({
                  data: () => raw,
                } as firestoreModule.QueryDocumentSnapshot)
              : raw;
          },
        })),
      };
    },
  });

  const makeCollection = (
    name: string,
    converter?: firestoreModule.FirestoreDataConverter<unknown>
  ): Record<string, unknown> => {
    const colMap = getColMap(name);
    return {
      ...makeQuery(colMap, [], converter),
      withConverter: (
        nextConverter: firestoreModule.FirestoreDataConverter<unknown>
      ) => makeCollection(name, nextConverter),
      doc: (id?: string): InMemoryDocRef => {
        const docId = id ?? `auto-id-${++autoIdCounter}`;
        const writeDoc = (
          data: Record<string, unknown>,
          options?: { merge?: boolean }
        ): void => {
          const serialized = (
            converter
              ? options
                ? converter.toFirestore(data, options)
                : converter.toFirestore(data)
              : data
          ) as Record<string, unknown>;
          applySet(colMap, docId, serialized, options);
        };
        return {
          id: docId,
          _key: `${name}/${docId}`,
          get: async () => {
            const existing = colMap.get(docId);
            return {
              exists: existing !== undefined,
              data: () => {
                if (!existing) {
                  return undefined;
                }
                const raw = { ...existing };
                return converter
                  ? converter.fromFirestore({
                      data: () => raw,
                    } as firestoreModule.QueryDocumentSnapshot)
                  : raw;
              },
            };
          },
          set: async (
            data: Record<string, unknown>,
            options?: { merge?: boolean }
          ) => {
            writeDoc(data, options);
          },
          delete: async () => {
            colMap.delete(docId);
          },
          _has: () => colMap.has(docId),
          _set: writeDoc,
        };
      },
    };
  };

  (db as unknown as Record<string, unknown>).collection = (name: string) =>
    makeCollection(name);

  (db as unknown as Record<string, unknown>).batch = () => {
    const ops: Array<
      | { type: "create"; ref: InMemoryDocRef; data: Record<string, unknown> }
      | {
          type: "set";
          ref: InMemoryDocRef;
          data: Record<string, unknown>;
          options?: { merge?: boolean };
        }
    > = [];
    const batch = {
      create: (ref: InMemoryDocRef, data: Record<string, unknown>) => {
        ops.push({ type: "create", ref, data });
        return batch;
      },
      set: (
        ref: InMemoryDocRef,
        data: Record<string, unknown>,
        options?: { merge?: boolean }
      ) => {
        ops.push({ type: "set", ref, data, options });
        return batch;
      },
      commit: async () => {
        const createdInBatch = new Set<string>();
        for (const op of ops) {
          if (op.type === "create") {
            if (op.ref._has() || createdInBatch.has(op.ref._key)) {
              throw Object.assign(
                new Error("ALREADY_EXISTS: Document already exists"),
                { code: GrpcStatus.ALREADY_EXISTS }
              );
            }
            createdInBatch.add(op.ref._key);
          }
        }
        for (const op of ops) {
          if (op.type === "create") {
            op.ref._set(op.data);
          } else {
            op.ref._set(op.data, op.options);
          }
        }
      },
    };
    return batch;
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
      const eventTime = "2026-01-15T12:34:56.789Z";
      const event = {
        params: { taskId },
        id: "event-create-1",
        time: eventTime,
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
      expect(auditDoc.data()?.timestamp).toBe(eventTime);
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

    it("ignores duplicate Eventarc deliveries with the same event.id without double-counting user stats", async () => {
      const db = getFirestore();
      const userId = "user-idempotent-stats";
      const taskId = "task-idempotent-1";
      const now = new Date().toISOString();

      await db.collection("user_stats").doc(userId).set({
        userId,
        activeTasks: 0,
        completedTasks: 0,
        lastUpdated: now,
      });

      const emptySnap = fft.firestore.makeDocumentSnapshot({}, `tasks/${taskId}`);
      const todoSnap = fft.firestore.makeDocumentSnapshot(
        {
          id: taskId,
          userId,
          title: "Idempotent task",
          description: "",
          priority: "medium",
          status: "todo",
          createdAt: now,
          updatedAt: now,
        },
        `tasks/${taskId}`
      );
      const completedSnap = fft.firestore.makeDocumentSnapshot(
        {
          id: taskId,
          userId,
          title: "Idempotent task",
          description: "",
          priority: "medium",
          status: "completed",
          createdAt: now,
          updatedAt: now,
        },
        `tasks/${taskId}`
      );

      // 1. Duplicate task creation event delivery (concurrent + sequential)
      const createEvent = {
        params: { taskId },
        id: "event-dup-create-1",
        data: new Change(emptySnap, todoSnap),
      };
      await Promise.all([
        wrappedOnTaskWritten({ ...createEvent }),
        wrappedOnTaskWritten({ ...createEvent }),
      ]);
      await wrappedOnTaskWritten({ ...createEvent });

      let statsSnap = await db.collection("user_stats").doc(userId).get();
      expect(statsSnap.data()?.activeTasks).toBe(1);
      expect(statsSnap.data()?.completedTasks).toBe(0);

      const createAuditSnap = await db
        .collection("audit_logs")
        .doc("event-dup-create-1")
        .get();
      expect(createAuditSnap.exists).toBe(true);

      // 2. Duplicate status transition event delivery (todo -> completed)
      const transitionEvent = {
        params: { taskId },
        id: "event-dup-status-1",
        data: new Change(todoSnap, completedSnap),
      };
      await Promise.all([
        wrappedOnTaskWritten({ ...transitionEvent }),
        wrappedOnTaskWritten({ ...transitionEvent }),
      ]);
      await wrappedOnTaskWritten({ ...transitionEvent });

      statsSnap = await db.collection("user_stats").doc(userId).get();
      expect(statsSnap.data()?.activeTasks).toBe(0);
      expect(statsSnap.data()?.completedTasks).toBe(1);

      const transitionAuditSnap = await db
        .collection("audit_logs")
        .doc("event-dup-status-1")
        .get();
      expect(transitionAuditSnap.exists).toBe(true);

      // 3. Duplicate task deletion event delivery
      const deleteEvent = {
        params: { taskId },
        id: "event-dup-delete-1",
        data: new Change(completedSnap, emptySnap),
      };
      await Promise.all([
        wrappedOnTaskWritten({ ...deleteEvent }),
        wrappedOnTaskWritten({ ...deleteEvent }),
      ]);
      await wrappedOnTaskWritten({ ...deleteEvent });

      statsSnap = await db.collection("user_stats").doc(userId).get();
      expect(statsSnap.data()?.activeTasks).toBe(0);
      expect(statsSnap.data()?.completedTasks).toBe(0);

      const deleteAuditSnap = await db
        .collection("audit_logs")
        .doc("event-dup-delete-1")
        .get();
      expect(deleteAuditSnap.exists).toBe(true);

      const allTaskAudits = await db
        .collection("audit_logs")
        .where("taskId", "==", taskId)
        .get();
      expect(allTaskAudits.docs.length).toBe(3);
    });
  });

  describe("TaskRepository service methods", () => {
    it("findById decodes valid tasks, returns Option.none for missing tasks, and deletes tasks", async () => {
      const created = await appRuntime.runPromise(
        Effect.gen(function* () {
          const repo = yield* TaskRepository;
          return yield* repo.create({
            userId: "user-repo",
            data: {
              title: "Repository test",
              description: "Verify findById and delete",
              priority: "urgent",
            },
          });
        })
      );
      expect(created.id).toBeTruthy();

      const found = await appRuntime.runPromise(
        Effect.gen(function* () {
          const repo = yield* TaskRepository;
          return yield* repo.findById(created.id);
        })
      );
      expect(Option.isSome(found)).toBe(true);

      await appRuntime.runPromise(
        Effect.gen(function* () {
          const repo = yield* TaskRepository;
          yield* repo.delete(created.id);
        })
      );

      const afterDelete = await appRuntime.runPromise(
        Effect.gen(function* () {
          const repo = yield* TaskRepository;
          return yield* repo.findById(created.id);
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
      if (Exit.isFailure(exit)) {
        const errOpt = Cause.findErrorOption(exit.cause);
        expect(Option.isSome(errOpt)).toBe(true);
        if (Option.isSome(errOpt)) {
          expect(errOpt.value._tag).toBe("FirestoreError");
        }
      }
      await db.collection("tasks").doc(corruptedId).delete();

      // Also verify UserStatsRepository.getByUserId maps converter decode failures to FirestoreError
      const corruptedStatsUserId = "repo-corrupted-stats-1";
      await db.collection("user_stats").doc(corruptedStatsUserId).set({
        userId: corruptedStatsUserId,
        activeTasks: "not-a-number",
      });

      const statsExit = await appRuntime.runPromiseExit(
        Effect.gen(function* () {
          const statsRepo = yield* UserStatsRepository;
          return yield* statsRepo.getByUserId(corruptedStatsUserId);
        })
      );
      expect(Exit.isFailure(statsExit)).toBe(true);
      if (Exit.isFailure(statsExit)) {
        const errOpt = Cause.findErrorOption(statsExit.cause);
        expect(Option.isSome(errOpt)).toBe(true);
        if (Option.isSome(errOpt)) {
          expect(errOpt.value._tag).toBe("FirestoreError");
        }
      }
      await db.collection("user_stats").doc(corruptedStatsUserId).delete();
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

      const statsRepo = await appRuntime.runPromise(
        Effect.gen(function* () {
          return yield* UserStatsRepository;
        })
      );
      const batch = db.batch();
      statsRepo.onStatusChanged(batch, userId, "archived", "todo");
      statsRepo.onStatusChanged(batch, userId, "archived", "completed");
      await batch.commit();

      const snap = await db.collection("user_stats").doc(userId).get();
      expect(snap.data()?.activeTasks).toBe(1);
      expect(snap.data()?.completedTasks).toBe(1);
    });

    it("AuditRepository.recordOnce commits audit log and stats atomically and returns false for duplicate event ids", async () => {
      const db = getFirestore();
      const userId = "user-record-once";
      const eventId = "event-record-once-1";
      const now = new Date().toISOString();

      await db.collection("user_stats").doc(userId).set({
        userId,
        activeTasks: 0,
        completedTasks: 0,
        lastUpdated: now,
      });

      const firstSuccess = await appRuntime.runPromise(
        Effect.gen(function* () {
          const auditRepo = yield* AuditRepository;
          const statsRepo = yield* UserStatsRepository;
          return yield* auditRepo.recordOnce(
            {
              id: eventId,
              taskId: "task-batch-1",
              userId,
              action: "created",
              details: { title: "Initial delivery" },
              timestamp: now,
            },
            (batch) => statsRepo.onTaskCreated(batch, userId)
          );
        })
      );
      expect(firstSuccess).toBe(true);

      let statsSnap = await db.collection("user_stats").doc(userId).get();
      expect(statsSnap.data()?.activeTasks).toBe(1);

      const duplicateAttempt = await appRuntime.runPromise(
        Effect.gen(function* () {
          const auditRepo = yield* AuditRepository;
          const statsRepo = yield* UserStatsRepository;
          return yield* auditRepo.recordOnce(
            {
              id: eventId,
              taskId: "task-batch-1",
              userId,
              action: "created",
              details: { title: "Duplicate delivery" },
              timestamp: "2099-01-01T00:00:00.000Z",
            },
            (batch) => statsRepo.onTaskCreated(batch, userId)
          );
        })
      );
      expect(duplicateAttempt).toBe(false);

      statsSnap = await db.collection("user_stats").doc(userId).get();
      expect(statsSnap.data()?.activeTasks).toBe(1);

      const auditSnap = await db.collection("audit_logs").doc(eventId).get();
      expect(auditSnap.exists).toBe(true);
      expect(auditSnap.data()?.details).toEqual({ title: "Initial delivery" });
      expect(auditSnap.data()?.timestamp).toBe(now);

      // Verify non-ALREADY_EXISTS commit errors map to FirestoreError rather than returning false
      const originalBatch = db.batch.bind(db);
      (db as unknown as Record<string, unknown>).batch = () => ({
        create: () => {},
        set: () => {},
        commit: async () => {
          throw Object.assign(new Error("UNAVAILABLE: backend unavailable"), {
            code: GrpcStatus.UNAVAILABLE,
          });
        },
      });
      try {
        const errorExit = await appRuntime.runPromiseExit(
          Effect.gen(function* () {
            const auditRepo = yield* AuditRepository;
            return yield* auditRepo.recordOnce({
              id: "event-unavailable-1",
              taskId: "task-batch-1",
              userId,
              action: "created",
              details: { title: "Unavailable test" },
              timestamp: now,
            });
          })
        );
        expect(Exit.isFailure(errorExit)).toBe(true);
        if (Exit.isFailure(errorExit)) {
          const errOpt = Cause.findErrorOption(errorExit.cause);
          expect(Option.isSome(errOpt)).toBe(true);
          if (Option.isSome(errOpt)) {
            expect(errOpt.value._tag).toBe("FirestoreError");
          }
        }
      } finally {
        (db as unknown as Record<string, unknown>).batch = originalBatch;
      }
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
