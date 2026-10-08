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
import { getFirestore } from "firebase-admin/firestore";
import { FirestoreError } from "../domain/errors";
import { UserStats, decodeUserStats } from "../domain/models";

export class UserStatsRepository extends Context.Service<
  UserStatsRepository,
  {
    readonly getByUserId: (
      userId: string
    ) => Effect.Effect<Option.Option<UserStats>, FirestoreError>;
  }
>()("effect-functions/services/UserStatsRepository") {
  static readonly layer: Layer.Layer<UserStatsRepository> = Layer.sync(
    UserStatsRepository,
    () => {
      const statsCol = getFirestore().collection("user_stats");

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
          const data = snap.data();
          if (!data) {
            return Option.none();
          }
          const stats = yield* decodeUserStats(data).pipe(
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

      return UserStatsRepository.of({ getByUserId });
    }
  );
}
