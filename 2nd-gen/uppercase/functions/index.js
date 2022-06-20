"use strict";

const {onRefCreated, onRefWritten} = require("firebase-functions/v2/database");
const {initializeApp} = require("firebase-admin/app");
const logger = require("firebase-functions/logger");
// const {getDatabase} = require("firebase-admin/database");

initializeApp();

// Listens for new messages added to /messages/:pushId/original and creates an
// uppercase version of the message to /messages/:pushId/uppercase
exports.makeuppercase = onRefCreated("messages/{pushId}/original", (event) => {
  // Grab the current value of what was written to the Realtime Database.
  const original = event.data.val();
  logger.log('Uppercasing', event.params.pushId, original);
  const uppercase = original.toUpperCase();
  // You must return a Promise when performing asynchronous tasks inside a Functions such as
  // writing to the Firebase Realtime Database.
  // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
  return event.data.ref.child('uppercase').set(uppercase);
});

// Same function using onRefWritten:
exports.makeuppercase2 = onRefWritten('messages/{pushId}/original', (event) => {
  // Only edit data when it is first created.
  if (event.data.before.exists()) {
    return null;
  }
  // Exit when the data is deleted.
  if (!event.data.after.exists()) {
    return null;
  }
  // Grab the current value of what was written to the Realtime Database.
  const original = event.data.after.val();
  console.log('Uppercasing', event.params.pushId, original);
  const uppercase = original.toUpperCase();
  // You must return a Promise when performing asynchronous tasks inside a Functions such as
  // writing to the Firebase Realtime Database.
  // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
  return event.data.after.ref.parent.child('uppercase').set(uppercase);
});
