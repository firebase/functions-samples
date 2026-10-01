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

import { Data } from "effect";

export class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{
  readonly message: string;
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly issues: ReadonlyArray<string>;
}> {}

export class TaskNotFoundError extends Data.TaggedError("TaskNotFoundError")<{
  readonly id: string;
}> {}

export class InvalidTransitionError extends Data.TaggedError("InvalidTransitionError")<{
  readonly from: string;
  readonly to: string;
  readonly reason: string;
}> {}

export class FirestoreError extends Data.TaggedError("FirestoreError")<{
  readonly cause: unknown;
  readonly message: string;
}> {}

export type DomainError =
  | UnauthorizedError
  | ValidationError
  | TaskNotFoundError
  | InvalidTransitionError
  | FirestoreError;
