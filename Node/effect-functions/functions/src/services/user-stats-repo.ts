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

import { Effect, Context, Layer, DateTime, Option } from "effect";
import { FirestoreService } from "./firestore";
import { FieldValue } from "firebase-admin/firestore";
import { FirestoreError } from "../domain/errors";
import { TaskStatus, UserStats, decodeUserStats } from "../domain/models";

const isActiveStatus = (status: TaskStatus): boolean =>
  status === "todo" || status === "in_progress";

export interface UserStatsRepositoryShape {
  readonly getByUserId: (
    userId: string
  ) => Effect.Effect<Option.Option<UserStats>, FirestoreError>;
  readonly onTaskCreated: (userId: string) => Effect.Effect<void, FirestoreError>;
  readonly onTaskCompleted: (userId: string) => Effect.Effect<void, FirestoreError>;
  readonly onTaskReopened: (userId: string) => Effect.Effect<void, FirestoreError>;
  readonly onTaskArchived: (
    userId: string,
    previousStatus: TaskStatus
  ) => Effect.Effect<void, FirestoreError>;
  readonly onStatusChanged: (
    userId: string,
    from: TaskStatus,
    to: TaskStatus
  ) => Effect.Effect<void, FirestoreError>;
  readonly onTaskDeleted: (
    userId: string,
    previousStatus: TaskStatus
  ) => Effect.Effect<void, FirestoreError>;
}

export class UserStatsRepository extends Context.Service<
  UserStatsRepository,
  UserStatsRepositoryShape
>()("effect-functions/services/UserStatsRepository") {
  static readonly layerNoDeps: Layer.Layer<
    UserStatsRepository,
    never,
    FirestoreService
  > = Layer.effect(
    UserStatsRepository,
    Effect.gen(function* () {
      const db = yield* FirestoreService;
      const statsCol = db.collection("user_stats");

      const getByUserId = Effect.fn("UserStatsRepository.getByUserId")(
        function* (userId: string) {
          const snap = yield* Effect.tryPromise({
            try: () => statsCol.doc(userId).get(),
            catch: (cause) =>
              new FirestoreError({
                cause,
                message: `Failed to fetch user stats for ${userId}`,
              }),
          });
          if (!snap.exists) {
            return Option.none<UserStats>();
          }
          const stats = yield* decodeUserStats(snap.data()).pipe(
            Effect.mapError(
              (cause) =>
                new FirestoreError({
                  cause,
                  message: `Failed to decode user stats for ${userId}`,
                })
            )
          );
          return Option.some(stats);
        }
      );

      const onTaskCreated = Effect.fn("UserStatsRepository.onTaskCreated")(
        function* (userId: string) {
          const lastUpdated = DateTime.formatIso(yield* DateTime.now);
          yield* Effect.tryPromise({
            try: async () => {
              await statsCol.doc(userId).set(
                {
                  userId,
                  activeTasks: FieldValue.increment(1),
                  completedTasks: FieldValue.increment(0),
                  lastUpdated,
                },
                { merge: true }
              );
            },
            catch: (cause) =>
              new FirestoreError({
                cause,
                message: `Failed to update user stats for created task (${userId})`,
              }),
          });
        }
      );

      const onTaskCompleted = Effect.fn("UserStatsRepository.onTaskCompleted")(
        function* (userId: string) {
          const lastUpdated = DateTime.formatIso(yield* DateTime.now);
          yield* Effect.tryPromise({
            try: async () => {
              await statsCol.doc(userId).set(
                {
                  userId,
                  activeTasks: FieldValue.increment(-1),
                  completedTasks: FieldValue.increment(1),
                  lastUpdated,
                },
                { merge: true }
              );
            },
            catch: (cause) =>
              new FirestoreError({
                cause,
                message: `Failed to update user stats for completed task (${userId})`,
              }),
          });
        }
      );

      const onTaskReopened = Effect.fn("UserStatsRepository.onTaskReopened")(
        function* (userId: string) {
          const lastUpdated = DateTime.formatIso(yield* DateTime.now);
          yield* Effect.tryPromise({
            try: async () => {
              await statsCol.doc(userId).set(
                {
                  userId,
                  activeTasks: FieldValue.increment(1),
                  completedTasks: FieldValue.increment(-1),
                  lastUpdated,
                },
                { merge: true }
              );
            },
            catch: (cause) =>
              new FirestoreError({
                cause,
                message: `Failed to update user stats for reopened task (${userId})`,
              }),
          });
        }
      );

      const onTaskArchived = Effect.fn("UserStatsRepository.onTaskArchived")(
        function* (userId: string, previousStatus: TaskStatus) {
          if (previousStatus === "archived") {
            return;
          }
          const lastUpdated = DateTime.formatIso(yield* DateTime.now);
          const activeDelta = isActiveStatus(previousStatus) ? -1 : 0;
          const completedDelta = previousStatus === "completed" ? -1 : 0;

          yield* Effect.tryPromise({
            try: async () => {
              await statsCol.doc(userId).set(
                {
                  userId,
                  activeTasks: FieldValue.increment(activeDelta),
                  completedTasks: FieldValue.increment(completedDelta),
                  lastUpdated,
                },
                { merge: true }
              );
            },
            catch: (cause) =>
              new FirestoreError({
                cause,
                message: `Failed to update user stats for archived task (${userId})`,
              }),
          });
        }
      );

      const onStatusChanged = Effect.fn("UserStatsRepository.onStatusChanged")(
        function* (userId: string, from: TaskStatus, to: TaskStatus) {
          if (from === to || (isActiveStatus(from) && isActiveStatus(to))) {
            return;
          }
          if (to === "completed" && isActiveStatus(from)) {
            return yield* onTaskCompleted(userId);
          }
          if (from === "completed" && isActiveStatus(to)) {
            return yield* onTaskReopened(userId);
          }
          if (to === "archived") {
            return yield* onTaskArchived(userId, from);
          }

          const lastUpdated = DateTime.formatIso(yield* DateTime.now);
          const activeDelta =
            (isActiveStatus(to) ? 1 : 0) - (isActiveStatus(from) ? 1 : 0);
          const completedDelta =
            (to === "completed" ? 1 : 0) - (from === "completed" ? 1 : 0);

          yield* Effect.tryPromise({
            try: async () => {
              await statsCol.doc(userId).set(
                {
                  userId,
                  activeTasks: FieldValue.increment(activeDelta),
                  completedTasks: FieldValue.increment(completedDelta),
                  lastUpdated,
                },
                { merge: true }
              );
            },
            catch: (cause) =>
              new FirestoreError({
                cause,
                message: `Failed to update user stats for status change ${from} -> ${to} (${userId})`,
              }),
          });
        }
      );

      const onTaskDeleted = Effect.fn("UserStatsRepository.onTaskDeleted")(
        function* (userId: string, previousStatus: TaskStatus) {
          const lastUpdated = DateTime.formatIso(yield* DateTime.now);
          const activeDelta = isActiveStatus(previousStatus) ? -1 : 0;
          const completedDelta = previousStatus === "completed" ? -1 : 0;

          yield* Effect.tryPromise({
            try: async () => {
              await statsCol.doc(userId).set(
                {
                  userId,
                  activeTasks: FieldValue.increment(activeDelta),
                  completedTasks: FieldValue.increment(completedDelta),
                  lastUpdated,
                },
                { merge: true }
              );
            },
            catch: (cause) =>
              new FirestoreError({
                cause,
                message: `Failed to update user stats for deleted task (${userId})`,
              }),
          });
        }
      );

      return UserStatsRepository.of({
        getByUserId,
        onTaskCreated,
        onTaskCompleted,
        onTaskReopened,
        onTaskArchived,
        onStatusChanged,
        onTaskDeleted,
      });
    })
  );

  static readonly layer: Layer.Layer<UserStatsRepository> =
    this.layerNoDeps.pipe(Layer.provide(FirestoreService.layer));
}

export const UserStatsRepositoryLive = UserStatsRepository.layerNoDeps;
