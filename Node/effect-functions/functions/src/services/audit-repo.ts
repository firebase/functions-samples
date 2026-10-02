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
import { Transaction } from "firebase-admin/firestore";
import { FirestoreService } from "./firestore";
import { AuditLog } from "../domain/models";
import { FirestoreError } from "../domain/errors";

export interface AuditRepositoryShape {
  readonly record: (entry: AuditLog) => Effect.Effect<void, FirestoreError>;
  readonly withIdempotentEvent: (
    entry: AuditLog,
    applySideEffects: (tx: Transaction) => Effect.Effect<void, FirestoreError>
  ) => Effect.Effect<boolean, FirestoreError>;
}

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
      const auditCol = db.collection("audit_logs");

      const record = Effect.fn("AuditRepository.record")(function* (
        entry: AuditLog
      ) {
        yield* Effect.tryPromise({
          try: async () => {
            await auditCol.doc(entry.id).set(entry);
          },
          catch: (cause) =>
            new FirestoreError({
              cause,
              message: `Failed to record audit log ${entry.id}`,
            }),
        });
      });

      const withIdempotentEvent = Effect.fn(
        "AuditRepository.withIdempotentEvent"
      )(function* (
        entry: AuditLog,
        applySideEffects: (
          tx: Transaction
        ) => Effect.Effect<void, FirestoreError>
      ) {
        const context = yield* Effect.context<never>();
        const runWithContext = Effect.runPromiseWith(context);
        return yield* Effect.tryPromise({
          try: () =>
            db.runTransaction(async (tx) => {
              const auditRef = auditCol.doc(entry.id);
              const snap = await tx.get(auditRef);
              if (snap.exists) {
                return false;
              }
              await runWithContext(applySideEffects(tx));
              tx.set(auditRef, entry);
              return true;
            }),
          catch: (cause) =>
            new FirestoreError({
              cause,
              message: `Failed to execute idempotent transaction for audit log ${entry.id}`,
            }),
        });
      });

      return AuditRepository.of({
        record,
        withIdempotentEvent,
      });
    })
  );

  static readonly layer: Layer.Layer<AuditRepository> =
    this.layerNoDeps.pipe(Layer.provide(FirestoreService.layer));
}

export const AuditRepositoryLive = AuditRepository.layerNoDeps;
