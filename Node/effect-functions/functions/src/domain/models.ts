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

import { Schema } from "effect";

export const TaskStatus = Schema.Literal("todo", "in_progress", "completed", "archived");
export type TaskStatus = typeof TaskStatus.Type;

export const TaskPriority = Schema.Literal("low", "medium", "high", "urgent");
export type TaskPriority = typeof TaskPriority.Type;

export const Task = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  title: Schema.NonEmptyTrimmedString,
  description: Schema.String,
  priority: TaskPriority,
  status: TaskStatus,
  createdAt: Schema.String,
  updatedAt: Schema.String,
});
export type Task = typeof Task.Type;

export const CreateTaskInput = Schema.Struct({
  title: Schema.NonEmptyTrimmedString,
  description: Schema.optional(Schema.String),
  priority: Schema.optional(TaskPriority),
});
export type CreateTaskInput = typeof CreateTaskInput.Type;

export const AuditAction = Schema.Literal("created", "status_changed", "deleted");
export type AuditAction = typeof AuditAction.Type;

export const AuditLog = Schema.Struct({
  id: Schema.String,
  taskId: Schema.String,
  userId: Schema.String,
  action: AuditAction,
  details: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
  timestamp: Schema.String,
});
export type AuditLog = typeof AuditLog.Type;

export const UserStats = Schema.Struct({
  userId: Schema.String,
  activeTasks: Schema.Number,
  completedTasks: Schema.Number,
  lastUpdated: Schema.String,
});
export type UserStats = typeof UserStats.Type;
