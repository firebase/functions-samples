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

import { Effect, Context, Layer, Option } from "effect";
import { FieldValue, type WriteBatch } from "firebase-admin/firestore";
import { FirestoreService } from "./firestore";
import { schemaConverter } from "./schema-converter";
import { FirestoreError } from "../domain/errors";
import { TaskStatus, UserStats } from "../domain/models";

const counters = (status: TaskStatus) => ({
  active: status === "todo" || status === "in_progress" ? 1 : 0,
  completed: status === "completed" ? 1 : 0,
});

export interface UserStatsRepositoryShape {
  readonly getByUserId: (
    userId: string
  ) => Effect.Effect<Option.Option<UserStats>, FirestoreError>;
  /** Enqueue counter adjustments into an atomic WriteBatch (committed by AuditRepository.recordOnce). */
  readonly onTaskCreated: (batch: WriteBatch, userId: string) => void;
  readonly onStatusChanged: (
    batch: WriteBatch,
    userId: string,
    from: TaskStatus,
    to: TaskStatus
  ) => void;
  readonly onTaskDeleted: (
    batch: WriteBatch,
    userId: string,
    previousStatus: TaskStatus
  ) => void;
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
      const statsCol = db
        .collection("user_stats")
        .withConverter(schemaConverter(UserStats));

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
          const stats = yield* Effect.try({
            try: () => snap.data(),
            catch: (cause) =>
              new FirestoreError({
                cause,
                message: `Failed to decode user stats for ${userId}`,
              }),
          });
          return Option.fromNullishOr(stats);
        }
      );

      const enqueueDelta = (
        batch: WriteBatch,
        userId: string,
        activeDelta: number,
        completedDelta: number
      ): void => {
        if (activeDelta === 0 && completedDelta === 0) {
          return;
        }
        batch.set(
          statsCol.doc(userId),
          {
            userId,
            activeTasks: FieldValue.increment(activeDelta),
            completedTasks: FieldValue.increment(completedDelta),
            lastUpdated: new Date().toISOString(),
          },
          { merge: true }
        );
      };

      const onTaskCreated = (batch: WriteBatch, userId: string): void => {
        enqueueDelta(batch, userId, 1, 0);
      };

      const onStatusChanged = (
        batch: WriteBatch,
        userId: string,
        from: TaskStatus,
        to: TaskStatus
      ): void => {
        const fromCounts = counters(from);
        const toCounts = counters(to);
        enqueueDelta(
          batch,
          userId,
          toCounts.active - fromCounts.active,
          toCounts.completed - fromCounts.completed
        );
      };

      const onTaskDeleted = (
        batch: WriteBatch,
        userId: string,
        previousStatus: TaskStatus
      ): void => {
        const prevCounts = counters(previousStatus);
        enqueueDelta(batch, userId, -prevCounts.active, -prevCounts.completed);
      };

      return UserStatsRepository.of({
        getByUserId,
        onTaskCreated,
        onStatusChanged,
        onTaskDeleted,
      });
    })
  );

  static readonly layer: Layer.Layer<UserStatsRepository> =
    this.layerNoDeps.pipe(Layer.provide(FirestoreService.layer));
}

export const UserStatsRepositoryLive = UserStatsRepository.layerNoDeps;
