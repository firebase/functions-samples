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
import { Task, CreateTaskInput } from "../domain/models";
import { FirestoreError } from "../domain/errors";

export interface TaskRepositoryShape {
  readonly create: (input: {
    readonly id: string;
    readonly userId: string;
    readonly data: CreateTaskInput;
  }) => Effect.Effect<Task, FirestoreError>;
  readonly findById: (
    id: string
  ) => Effect.Effect<Option.Option<Task>, FirestoreError>;
  readonly delete: (id: string) => Effect.Effect<void, FirestoreError>;
}

export class TaskRepository extends Context.Tag("TaskRepository")<
  TaskRepository,
  TaskRepositoryShape
>() {}

export const TaskRepositoryLive = Layer.effect(
  TaskRepository,
  Effect.gen(function* () {
    const db = yield* FirestoreService;
    const tasksCol = db.collection("tasks");

    return {
      create: ({ id, userId, data }) =>
        Effect.tryPromise({
          try: async () => {
            const now = new Date().toISOString();
            const docData: Task = {
              id,
              userId,
              title: data.title,
              description: data.description ?? "",
              priority: data.priority ?? "medium",
              status: "todo",
              createdAt: now,
              updatedAt: now,
            };
            await tasksCol.doc(id).set(docData);
            return docData;
          },
          catch: (cause) =>
            new FirestoreError({
              cause,
              message: `Failed to create task with id ${id}`,
            }),
        }),

      findById: (id: string) =>
        Effect.tryPromise({
          try: async () => {
            const snap = await tasksCol.doc(id).get();
            if (!snap.exists) {
              return Option.none();
            }
            return Option.some(snap.data() as Task);
          },
          catch: (cause) =>
            new FirestoreError({
              cause,
              message: `Failed to fetch task with id ${id}`,
            }),
        }),

      delete: (id: string) =>
        Effect.tryPromise({
          try: async () => {
            await tasksCol.doc(id).delete();
          },
          catch: (cause) =>
            new FirestoreError({
              cause,
              message: `Failed to delete task with id ${id}`,
            }),
        }),
    };
  })
);
