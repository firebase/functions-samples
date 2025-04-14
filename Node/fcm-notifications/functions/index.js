/**
 * Copyright 2023 Google Inc. All Rights Reserved.
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

import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { getMessaging } from "firebase-admin/messaging";
import { log, warn } from "firebase-functions/logger";
import { onValueWritten } from "firebase-functions/v2/database";

initializeApp();
const auth = getAuth();
const db = getDatabase();
const messaging = getMessaging();

/**
 * Triggers when a user gets a new follower and sends a notification. Followers
 * add a flag to `/followers/{followedUid}/{followerUid}`. Users save their
 * device notification tokens to
 * `/users/{followedUid}/notificationTokens/{notificationToken}`.
 */
export const sendFollowerNotification = onValueWritten(
  "/followers/{followedUid}/{followerUid}",
  async (event) => {
    // If un-follow we exit the function.
    if (!event.data.after.val()) {
      log(
        `User ${event.params.followerUid} unfollowed` +
          ` user ${event.params.followedUid} :(`,
      );
      return;
    }

    log(
      `User ${event.params.followerUid} is now following` +
        ` user ${event.params.followedUid}`,
    );
    const tokensRef = db.ref(
      `/users/${event.params.followedUid}/notificationTokens`,
    );
    const notificationTokens = await tokensRef.get();
    if (!notificationTokens.hasChildren()) {
      log("There are no tokens to send notifications to.");
      return;
    }

    log(
      `There are ${notificationTokens.numChildren()} tokens` +
        " to send notifications to.",
    );
    const followerProfile = await auth.getUser(event.params.followerUid);

    // Notification details.
    const notification = {
      title: "You have a new follower!",
      body:
        (followerProfile.displayName ?? "Someone") + " is now following you.",
      image: followerProfile.photoURL ?? "",
    };

    // Send notifications to all tokens.
    const messages = [];
    notificationTokens.forEach((child) => {
      messages.push({
        token: child.key,
        notification: notification,
      });
    });
    const batchResponse = await messaging.sendEach(messages);

    if (batchResponse.failureCount < 1) {
      // Messages sent sucessfully. We're done!
      log("Messages sent.");
      return;
    }
    warn(`${batchResponse.failureCount} messages weren't sent.`, batchResponse);

    // Clean up the tokens that are not registered any more.
    for (let i = 0; i < batchResponse.responses.length; i++) {
      const errorCode = batchResponse.responses[i].error?.code;
      const errorMessage = batchResponse.responses[i].error?.message;
      if (
        errorCode === "messaging/invalid-registration-token" ||
        errorCode === "messaging/registration-token-not-registered" ||
        (errorCode === "messaging/invalid-argument" &&
          errorMessage ===
            "The registration token is not a valid FCM registration token")
      ) {
        log(`Removing invalid token: ${messages[i].token}`);
        await tokensRef.child(messages[i].token).remove();
      }
    }
  },
);
