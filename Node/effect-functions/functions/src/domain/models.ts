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

import { Effect, Schema } from "effect";

export const NonEmptyTrimmedString = Schema.Trim.check(Schema.isNonEmpty());

export const TaskStatus = Schema.Literals(["todo", "in_progress", "completed", "archived"]);
export type TaskStatus = typeof TaskStatus.Type;

export const TaskPriority = Schema.Literals(["low", "medium", "high", "urgent"]);

export const Task = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  title: NonEmptyTrimmedString,
  description: Schema.String,
  priority: TaskPriority,
  status: TaskStatus,
  createdAt: Schema.String,
  updatedAt: Schema.String,
});
export type Task = typeof Task.Type;

export const CreateTaskInput = Schema.Struct({
  title: NonEmptyTrimmedString,
  description: Schema.String.pipe(Schema.withDecodingDefault(Effect.succeed(""))),
  priority: TaskPriority.pipe(Schema.withDecodingDefault(Effect.succeed("medium" as const))),
});
export type CreateTaskInput = typeof CreateTaskInput.Type;

export const UserStats = Schema.Struct({
  userId: Schema.String,
  activeTasks: Schema.Number,
  completedTasks: Schema.Number,
  lastUpdated: Schema.String,
});
export type UserStats = typeof UserStats.Type;

export const decodeCreateTaskInput = Schema.decodeUnknownEffect(CreateTaskInput);
export const decodeTask = Schema.decodeUnknownEffect(Task);
export const decodeUserStats = Schema.decodeUnknownEffect(UserStats);
