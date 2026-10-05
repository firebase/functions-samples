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

import { Logger, Predicate } from "effect";
import { logger } from "firebase-functions";
import type { LogSeverity } from "firebase-functions/logger";

function toLogSeverity(level: string): LogSeverity {
  switch (level) {
    case "TRACE":
    case "DEBUG":
      return "DEBUG";
    case "INFO":
      return "INFO";
    case "WARN":
      return "WARNING";
    case "ERROR":
      return "ERROR";
    case "FATAL":
      return "CRITICAL";
    default:
      return "INFO";
  }
}

/**
 * Custom Effect Logger built on `Logger.formatStructured` that routes Effect logs
 * (`Effect.logInfo`, `Effect.logError`, etc.) directly into `firebase-functions/logger`.
 *
 * Annotations (`Effect.annotateLogs`), spans (`Effect.withLogSpan`), causes, and fiber IDs
 * are preserved as structured fields within Cloud Logging's `jsonPayload`.
 */
const cloudLogger = Logger.formatStructured.pipe(
  Logger.map(({ level, message, cause, annotations, spans, fiberId }) => {
    const formattedMessage = (Array.isArray(message) ? message : [message])
      .map((part) => (Predicate.isString(part) ? part : JSON.stringify(part)))
      .join(" ");

    logger.write({
      ...annotations,
      fiberId,
      ...(Object.keys(spans).length > 0 ? { spans } : {}),
      ...(cause !== undefined ? { cause } : {}),
      severity: toLogSeverity(level),
      message: formattedMessage,
    });
  })
);

export const FirebaseLoggerLive = Logger.layer([cloudLogger]);
