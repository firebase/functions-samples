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
import { FirestoreService } from "./firestore";
import { schemaConverter } from "./schema-converter";
import { Task, CreateTaskInput } from "../domain/models";
import { FirestoreError } from "../domain/errors";

export interface TaskRepositoryShape {
  readonly create: (input: {
    readonly userId: string;
    readonly data: CreateTaskInput;
  }) => Effect.Effect<Task, FirestoreError>;
  readonly findById: (
    id: string
  ) => Effect.Effect<Option.Option<Task>, FirestoreError>;
  readonly delete: (id: string) => Effect.Effect<void, FirestoreError>;
}

export class TaskRepository extends Context.Service<
  TaskRepository,
  TaskRepositoryShape
>()("effect-functions/services/TaskRepository") {
  static readonly layerNoDeps: Layer.Layer<
    TaskRepository,
    never,
    FirestoreService
  > = Layer.effect(
    TaskRepository,
    Effect.gen(function* () {
      const db = yield* FirestoreService;
      const tasksCol = db
        .collection("tasks")
        .withConverter(schemaConverter(Task));

      const create = Effect.fn("TaskRepository.create")(function* ({
        userId,
        data,
      }: {
        readonly userId: string;
        readonly data: CreateTaskInput;
      }) {
        const docRef = tasksCol.doc();
        const now = new Date().toISOString();
        const docData: Task = {
          id: docRef.id,
          userId,
          title: data.title,
          description: data.description,
          priority: data.priority,
          status: "todo",
          createdAt: now,
          updatedAt: now,
        };
        yield* Effect.tryPromise({
          try: () => docRef.set(docData),
          catch: (cause) =>
            new FirestoreError({
              cause,
              message: `Failed to create task with id ${docRef.id}`,
            }),
        });
        return docData;
      });

      const findById = Effect.fn("TaskRepository.findById")(function* (
        id: string
      ) {
        const snap = yield* Effect.tryPromise({
          try: () => tasksCol.doc(id).get(),
          catch: (cause) =>
            new FirestoreError({
              cause,
              message: `Failed to fetch task with id ${id}`,
            }),
        });
        const task = yield* Effect.try({
          try: () => snap.data(),
          catch: (cause) =>
            new FirestoreError({
              cause,
              message: `Failed to decode task with id ${id}`,
            }),
        });
        return Option.fromNullishOr(task);
      });

      const deleteTask = Effect.fn("TaskRepository.delete")(function* (
        id: string
      ) {
        yield* Effect.tryPromise({
          try: async () => {
            await tasksCol.doc(id).delete();
          },
          catch: (cause) =>
            new FirestoreError({
              cause,
              message: `Failed to delete task with id ${id}`,
            }),
        });
      });

      return TaskRepository.of({
        create,
        findById,
        delete: deleteTask,
      });
    })
  );

  static readonly layer: Layer.Layer<TaskRepository> =
    this.layerNoDeps.pipe(Layer.provide(FirestoreService.layer));
}

export const TaskRepositoryLive = TaskRepository.layerNoDeps;
