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

import { Layer, ManagedRuntime } from "effect";
import { FirestoreLive } from "./services/firestore";
import { TaskRepositoryLive } from "./services/task-repo";
import { AuditRepositoryLive } from "./services/audit-repo";
import { UserStatsRepositoryLive } from "./services/user-stats-repo";
import { FirebaseLoggerLive } from "./logger/cloud-logger";

/**
 * Compose all domain repositories, injecting the Firestore client service into them.
 */
export const RepositoriesLive = Layer.mergeAll(
  TaskRepositoryLive,
  AuditRepositoryLive,
  UserStatsRepositoryLive
).pipe(Layer.provide(FirestoreLive));

/**
 * Top-level application layer providing all services, databases, and logger integrations.
 */
export const AppLiveLayer = Layer.mergeAll(
  RepositoriesLive,
  FirestoreLive,
  FirebaseLoggerLive
);

/**
 * Module-scoped ManagedRuntime.
 *
 * By creating the runtime at the module top level, services, connections, and memoized
 * layers are reused across warm invocations of Cloud Functions instances, minimizing latency.
 */
export const appRuntime = ManagedRuntime.make(AppLiveLayer);
