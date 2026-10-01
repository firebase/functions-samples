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
import { createTask, onTaskWritten } from "../index";

const { getFirestore } = firestoreModule;

// Compatibility shim for firebase-functions-test with firebase-admin v14
if (typeof (admin as Record<string, unknown>).firestore !== "function") {
  (admin as Record<string, unknown>).firestore = Object.assign(
    firestoreModule.getFirestore,
    firestoreModule
  );
}

const fft = firebaseFunctionsTest({
  projectId: "demo-effect-functions",
});

describe("Effect Cloud Functions", () => {
  beforeAll(() => {
    if (!getApps().some((app) => app.name === "[DEFAULT]")) {
      initializeApp({ projectId: "demo-effect-functions" });
    }
  });

  afterAll(() => {
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

      // Verify persisted document in Firestore when emulator is running
      if (process.env.FIRESTORE_EMULATOR_HOST) {
        const db = getFirestore();
        const docSnap = await db.collection("tasks").doc(result.id).get();
        expect(docSnap.exists).toBe(true);
        expect(docSnap.data()?.title).toBe("Complete Effect.ts sample");
      }
    });
  });

  describe("onTaskWritten (onDocumentWritten)", () => {
    const wrappedOnTaskWritten = fft.wrap(onTaskWritten);

    it("processes task creation: records audit log and updates user stats", async () => {
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

      if (process.env.FIRESTORE_EMULATOR_HOST) {
        const db = getFirestore();
        const statsSnap = await db.collection("user_stats").doc(userId).get();
        expect(statsSnap.exists).toBe(true);
        expect(statsSnap.data()?.activeTasks).toBeGreaterThanOrEqual(1);

        const auditSnaps = await db
          .collection("audit_logs")
          .where("taskId", "==", taskId)
          .where("action", "==", "created")
          .get();
        expect(auditSnaps.empty).toBe(false);
      }
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

      if (process.env.FIRESTORE_EMULATOR_HOST) {
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
      }
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

      if (process.env.FIRESTORE_EMULATOR_HOST) {
        const db = getFirestore();
        const auditSnaps = await db
          .collection("audit_logs")
          .where("taskId", "==", taskId)
          .where("action", "==", "deleted")
          .get();
        expect(auditSnaps.empty).toBe(false);
      }
    });
  });
});
