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

import { Effect, Context, Layer, Predicate } from "effect";
import { GrpcStatus, type WriteBatch } from "firebase-admin/firestore";
import { FirestoreService } from "./firestore";
import { schemaConverter } from "./schema-converter";
import { AuditLog } from "../domain/models";
import { FirestoreError } from "../domain/errors";

export interface AuditRepositoryShape {
  /**
   * Atomically commits `audit_logs/{entry.id}` together with any writes enqueued by `enqueueWrites`.
   * `WriteBatch.create()` rejects the entire batch with ALREADY_EXISTS when `entry.id` was already
   * recorded (e.g. an Eventarc redelivery), so duplicates apply nothing and resolve to `false`.
   */
  readonly recordOnce: (
    entry: AuditLog,
    enqueueWrites?: (batch: WriteBatch) => void
  ) => Effect.Effect<boolean, FirestoreError>;
}

const isAlreadyExists = (cause: unknown): boolean =>
  Predicate.hasProperty(cause, "code") &&
  cause.code === GrpcStatus.ALREADY_EXISTS;

export class AuditRepository extends Context.Service<
  AuditRepository,
  AuditRepositoryShape
>()("effect-functions/services/AuditRepository") {
  static readonly layerNoDeps: Layer.Layer<
    AuditRepository,
    never,
    FirestoreService
  > = Layer.effect(
    AuditRepository,
    Effect.gen(function* () {
      const db = yield* FirestoreService;
      const auditCol = db
        .collection("audit_logs")
        .withConverter(schemaConverter(AuditLog));

      const recordOnce = Effect.fn("AuditRepository.recordOnce")(function* (
        entry: AuditLog,
        enqueueWrites?: (batch: WriteBatch) => void
      ) {
        const batch = db.batch();
        batch.create(auditCol.doc(entry.id), entry);
        enqueueWrites?.(batch);
        return yield* Effect.tryPromise({
          try: () => batch.commit(),
          catch: (cause) => cause,
        }).pipe(
          Effect.as(true),
          Effect.catchIf(isAlreadyExists, () => Effect.succeed(false)),
          Effect.mapError(
            (cause) =>
              new FirestoreError({
                cause,
                message: `Failed to commit audit log ${entry.id}`,
              })
          )
        );
      });

      return AuditRepository.of({
        recordOnce,
      });
    })
  );

  static readonly layer: Layer.Layer<AuditRepository> =
    this.layerNoDeps.pipe(Layer.provide(FirestoreService.layer));
}

export const AuditRepositoryLive = AuditRepository.layerNoDeps;
