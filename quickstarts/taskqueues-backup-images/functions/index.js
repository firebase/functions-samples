/**
 * Copyright 2022 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for t`he specific language governing permissions and
 * limitations under the License.
 */
// [START import]
"use strict";
const path = require("path");
const fetch = require("node-fetch");
const functions = require("firebase-functions");
const {initializeApp} = require("firebase-admin/app");
const {getFunctions} = require("firebase-admin/functions");
const {getStorage} = require("firebase-admin/storage");
const logger = functions.logger;
const HttpsError = functions.https.HttpsError;
initializeApp();
// [END import]


// [START backupImages]
/**
 * Grabs Astronomy Photo of the Day (APOD) using NASA's API.
 *
 */
exports.backupApod = functions
    // [START securelyStoreAPIKey]
    .runWith( {secrets: ["NASA_API_KEY"]})
    // [END securelyStoreAPIKey]
    // [START taskQueueConfig]
    .tasks.taskQueue({
      retryConfig: {
        maxAttempts: 1, // TODO
        minBackoffSeconds: 60,
      },
      rateLimits: {
        maxConcurrentDispatches: 6,
      },
    // [END taskQueueConfig]
    }).onDispatch(async (data) => {
      const date = data.date;
      if (!date) {
        logger.warn("Invalid payload. Must include date.");
        throw new HttpsError(
            "invalid-argument",
            "Invalid payload. Must include date.",
        );
      }

      logger.info(`Requesting data from apod api for date ${date}`);
      // [START callAPI]
      let url = "https://api.nasa.gov/planetary/apod";
      url += `?date=${date}`;
      url += `&api_key=${process.env.NASA_API_KEY}`;
      const apiResp = await fetch(url);
      if (!apiResp.ok) {
        logger.warn(
            `request to NASA APOD API failed with reponse ${apiResp.status}`,
        );
        if (apiResp.status === 404) {
          // APOD not published for the day. This is fine!
          return;
        }
        if (apiResp.status >= 500) {
          throw new HttpsError(
              "unavailable",
              "APOD API temporarily not available.",
          );
        }
        throw new HttpsError("internal", "Uh-oh. Something broke.");
      }
      const apod = await apiResp.json();
      const picUrl = apod.hdurl;
      logger.info(`Fetched ${picUrl} from NASA API for date ${date}.`);
      // [END callAPI]

      // [START uploadImage]
      const picResp = await fetch(picUrl);
      const dest = getStorage()
          .bucket()
          .file(`apod/${date}${path.extname(picUrl)}`);
      try {
        await new Promise((resolve, reject) => {
          const stream = dest.createWriteStream();
          picResp.body.pipe(stream);
          picResp.body.on("end", resolve);
          stream.on("error", reject);
        });
      } catch (err) {
        logger.error(`Failed to upload ${picUrl} to ${dest.name}`, err);
        throw new HttpsError("internal", "Uh-oh. Something broke.");
      }
      // [END uploadImage]
      return;
    });

// [START backupSetup]
const BACKUP_START_DATE = new Date("1995-06-17");
const BACKUP_COUNT = 50; // TODO: Update this to 9000
const HOURLY_BATCH_SIZE = 10; // TODO: Update this to 500
// [START backupSetup]

exports.enqueueBackupTasks = functions.https.onRequest(
    async (_request, response) => {
      // [START connectToTaskQueue]
      const queue = getFunctions().taskQueue("backupApod");
      // [END connectToTaskQueue]

      const enqueues = [];
      for (let i = 0; i <= BACKUP_COUNT; i += 1) {
        // [START calculateDelay]
        const iteration = Math.floor(i / HOURLY_BATCH_SIZE);
        // TODO: Delay each BATCH an hour.
        const scheduleDelaySeconds = iteration * (60 * 5);
        // [END calculateDelay]

        const backupDate = new Date(BACKUP_START_DATE);
        backupDate.setDate(BACKUP_START_DATE.getDate() + i);
        // Extract just the date portion (YYYY-MM-DD) as string.
        const date = backupDate.toISOString().substring(0, 10);
        // [START enqueueBackupTask]
        enqueues.push(
            queue.enqueue({date}, {scheduleDelaySeconds}),
        );
        // [END enqueueBackupTask]
      }
      await Promise.all(enqueues);
      response.sendStatus(200);
    });
