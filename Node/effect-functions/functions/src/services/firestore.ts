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

import { Context, Layer } from "effect";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getApps, initializeApp } from "firebase-admin/app";

export class FirestoreService extends Context.Tag("FirestoreService")<
  FirestoreService,
  Firestore
>() {}

export const FirestoreLive = Layer.sync(FirestoreService, () => {
  const defaultApp = getApps().find((app) => app.name === "[DEFAULT]");
  const app =
    defaultApp ??
    initializeApp(
      process.env.GCLOUD_PROJECT
        ? { projectId: process.env.GCLOUD_PROJECT }
        : undefined
    );
  return getFirestore(app);
});
