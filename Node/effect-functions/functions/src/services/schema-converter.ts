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
import type {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";

/**
 * Firestore converter whose `fromFirestore` validates every read document with an Effect Schema.
 */
export const schemaConverter = <A extends DocumentData>(
  schema: Schema.ConstraintDecoder<A>
): FirestoreDataConverter<A> => {
  const decode = Schema.decodeUnknownSync(schema);
  return {
    toFirestore: (model) => model,
    fromFirestore: (snapshot: QueryDocumentSnapshot) => decode(snapshot.data()),
  };
};
