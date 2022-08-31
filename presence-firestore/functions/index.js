/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// [START presence_sync_function]
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Since this code will be running in the Cloud Functions environment
// we call initialize Firestore without any arguments because it
// detects authentication from the environment.
const firestore = admin.firestore();

// Create a new function which is triggered on changes to /status/{uid}/sessions/{sessionId}
// Note: This is a Realtime Database trigger, *not* Firestore.
exports.onUserStatusChanged = functions.database.ref('/status/{uid}/sessions/{sessionId}').onUpdate(
    async (change, context) => {
      // Get the data written to Realtime Database
      const eventStatus = change.after.val();

      const sessionId = context.params.sessionId;

      // Then use other event data to create a reference to the
      // corresponding Firestore document.
      const userFirestoreRef = firestore.doc(`status/${context.params.uid}`);
      const userSessionCollectionRef = userFirestoreRef.collection('sessions');
      const sessionStatusFirestoreRef = userSessionCollectionRef.doc(sessionId);

      // It is likely that the Realtime Database change that triggered
      // this event has already been overwritten by a fast change in
      // online / offline status, so we'll re-read the current data
      // and compare the timestamps.
      const statusSnapshot = await change.after.ref.once('value');
      const status = statusSnapshot.val();
      functions.logger.log(status, eventStatus);
      // If the current timestamp for this data is newer than
      // the data that triggered this event, we exit this function.
      if (status.last_changed > eventStatus.last_changed) {
        return null;
      }
      // Otherwise, we convert the last_changed field to a Date
      eventStatus.last_changed = new Date(eventStatus.last_changed);

      if(status.state === 'offline') {
        // ... and write it to Firestore.
        await sessionStatusFirestoreRef.delete();

        if ((await userSessionCollectionRef.get()).empty) {
          return userFirestoreRef.delete();
        }
      } else {
        await userFirestoreRef.set({ uid: context.params.uid });
        return sessionStatusFirestoreRef.set(status.sessions[sessionId]);
      }
      return null;
    });
// [END presence_sync_function]
