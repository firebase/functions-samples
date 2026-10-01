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

import { Logger, Layer } from "effect";
import { logger } from "firebase-functions";

/**
 * Custom Effect Logger layer that routes Effect logs (Effect.logInfo, Effect.logError, etc.)
 * directly into firebase-functions/logger.
 *
 * Annotations set via Effect.annotateLogs are automatically converted to structured attributes
 * within Cloud Logging's jsonPayload.
 */
export const FirebaseLoggerLive = Logger.replace(
  Logger.defaultLogger,
  Logger.make(({ logLevel, message, annotations }) => {
    const structuredData: Record<string, unknown> = {};
    for (const [key, value] of annotations) {
      structuredData[key] = value;
    }

    const formattedMessage = Array.isArray(message)
      ? message.map((item) => (typeof item === "object" ? JSON.stringify(item) : String(item))).join(" ")
      : String(message);

    switch (logLevel._tag) {
      case "Debug":
      case "Trace":
        logger.debug(formattedMessage, structuredData);
        break;
      case "Info":
        logger.info(formattedMessage, structuredData);
        break;
      case "Warning":
        logger.warn(formattedMessage, structuredData);
        break;
      case "Error":
      case "Fatal":
        logger.error(formattedMessage, structuredData);
        break;
      default:
        logger.log(formattedMessage, structuredData);
    }
  })
);
