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

import { Effect, Context, Layer } from "effect";
import { FirestoreService } from "./firestore";
import { FieldValue } from "firebase-admin/firestore";
import { FirestoreError } from "../domain/errors";

export interface UserStatsRepositoryShape {
  readonly onTaskCreated: (userId: string) => Effect.Effect<void, FirestoreError>;
  readonly onTaskCompleted: (userId: string) => Effect.Effect<void, FirestoreError>;
  readonly onTaskReopened: (userId: string) => Effect.Effect<void, FirestoreError>;
  readonly onTaskDeleted: (
    userId: string,
    wasCompleted: boolean
  ) => Effect.Effect<void, FirestoreError>;
}

export class UserStatsRepository extends Context.Tag("UserStatsRepository")<
  UserStatsRepository,
  UserStatsRepositoryShape
>() {}

export const UserStatsRepositoryLive = Layer.effect(
  UserStatsRepository,
  Effect.gen(function* () {
    const db = yield* FirestoreService;
    const statsCol = db.collection("user_stats");

    return {
      onTaskCreated: (userId) =>
        Effect.tryPromise({
          try: async () => {
            await statsCol.doc(userId).set(
              {
                userId,
                activeTasks: FieldValue.increment(1),
                completedTasks: FieldValue.increment(0),
                lastUpdated: new Date().toISOString(),
              },
              { merge: true }
            );
          },
          catch: (cause) =>
            new FirestoreError({
              cause,
              message: `Failed to update user stats for created task (${userId})`,
            }),
        }),

      onTaskCompleted: (userId) =>
        Effect.tryPromise({
          try: async () => {
            await statsCol.doc(userId).set(
              {
                userId,
                activeTasks: FieldValue.increment(-1),
                completedTasks: FieldValue.increment(1),
                lastUpdated: new Date().toISOString(),
              },
              { merge: true }
            );
          },
          catch: (cause) =>
            new FirestoreError({
              cause,
              message: `Failed to update user stats for completed task (${userId})`,
            }),
        }),

      onTaskReopened: (userId) =>
        Effect.tryPromise({
          try: async () => {
            await statsCol.doc(userId).set(
              {
                userId,
                activeTasks: FieldValue.increment(1),
                completedTasks: FieldValue.increment(-1),
                lastUpdated: new Date().toISOString(),
              },
              { merge: true }
            );
          },
          catch: (cause) =>
            new FirestoreError({
              cause,
              message: `Failed to update user stats for reopened task (${userId})`,
            }),
        }),

      onTaskDeleted: (userId, wasCompleted) =>
        Effect.tryPromise({
          try: async () => {
            await statsCol.doc(userId).set(
              {
                userId,
                activeTasks: wasCompleted
                  ? FieldValue.increment(0)
                  : FieldValue.increment(-1),
                completedTasks: wasCompleted
                  ? FieldValue.increment(-1)
                  : FieldValue.increment(0),
                lastUpdated: new Date().toISOString(),
              },
              { merge: true }
            );
          },
          catch: (cause) =>
            new FirestoreError({
              cause,
              message: `Failed to update user stats for deleted task (${userId})`,
            }),
        }),
    };
  })
);
