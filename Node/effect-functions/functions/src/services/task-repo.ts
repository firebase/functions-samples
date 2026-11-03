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
import { getFirestore } from "firebase-admin/firestore";
import { Task, CreateTaskInput } from "../domain/models";
import { FirestoreError } from "../domain/errors";

export class TaskRepository extends Context.Service<
  TaskRepository,
  {
    readonly create: (input: {
      readonly userId: string;
      readonly data: CreateTaskInput;
    }) => Effect.Effect<Task, FirestoreError>;
  }
>()("effect-functions/services/TaskRepository") {
  static readonly layer: Layer.Layer<TaskRepository> = Layer.sync(
    TaskRepository,
    () => {
      const tasksCol = getFirestore().collection("tasks");

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

      return TaskRepository.of({ create });
    }
  );
}
