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
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";

// [START all]
// [START import]
// The Cloud Functions for Firebase SDK to set up triggers and logging.
const {onSchedule} = require("firebase-functions/scheduler");
const {logger} = require("firebase-functions");

// The Firebase Admin SDK to delete inactive users.
const admin = require("firebase-admin");
admin.initializeApp();

// The es6-promise-pool to limit the concurrency of promises.
const PromisePool = require("es6-promise-pool").default;
// Maximum concurrent account deletions.
const MAX_CONCURRENT = 3;
// [END import]

// [START accountcleanup]
// Run once a day at midnight, to clean up the users
// Manually run the task here https://console.cloud.google.com/cloudscheduler
exports.accountcleanup = onSchedule("every day 00:00", async (event) => {
  // Fetch all user details.
  const inactiveUsers = await getInactiveUsers();

  // Use a pool so that we delete maximum `MAX_CONCURRENT` users in parallel.
  const promisePool = new PromisePool(
      () => deleteInactiveUser(inactiveUsers),
      MAX_CONCURRENT,
  );
  await promisePool.start();

  logger.log("User cleanup finished");
});
// [END accountcleanup]

// [START deleteInactiveUser]
/**
 * Deletes one inactive user from the list.
 * @param {admin.auth.UserRecord[]} inactiveUsers
 * @return {null | Promise<void>}
 */
function deleteInactiveUser(inactiveUsers) {
  if (inactiveUsers.length > 0) {
    const userToDelete = inactiveUsers.pop();

    // Delete the inactive user.
    return admin.auth().deleteUser(userToDelete.uid).then(() => {
      return logger.log(
          "Deleted user account",
          userToDelete.uid,
          "because of inactivity",
      );
    }).catch((error) => {
      return logger.error(
          "Deletion of inactive user account",
          userToDelete.uid,
          "failed:",
          error,
      );
    });
  } else {
    return null;
  }
}
// [END deleteInactiveUser]

// [START getInactiveUsers]
// Returns the list of all inactive users.
/**
 *
 * @param {admin.auth.UserRecord[]} [users] the current list of inactive users
 * @param {string} [nextPageToken]
 * @return {Promise<admin.auth.UserRecord[]>}
 */
async function getInactiveUsers(users = [], nextPageToken) {
  const result = await admin.auth().listUsers(1000, nextPageToken);
  // Find users that have not signed in in the last 30 days.
  const inactiveUsers = result.users.filter(
      (user) =>
        Date.parse(
            user.metadata.lastRefreshTime || user.metadata.lastSignInTime,
        ) <
      Date.now() - 30 * 24 * 60 * 60 * 1000,
  );

  // Add to the list of previously found inactive users.
  users = users.concat(inactiveUsers);

  // If there are more users to fetch we fetch them.
  if (result.pageToken) {
    return getInactiveUsers(users, result.pageToken);
  }

  return users;
}
// [END getInactiveUsers]
// [END all]
