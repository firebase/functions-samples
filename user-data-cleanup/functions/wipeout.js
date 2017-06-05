/**
 * Copyright 2017 Google Inc. All Rights Reserved.
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
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

buildPath = (uid) => {
  const dataPath = functions.config().wipeout.path;
  const dataPathSplit = dataPath.split('/');
  const wipeoutPath = dataPathSplit.join('/') +
        (dataPathSplit[dataPathSplit.length - 1] === '' ? '' : '/') +
        uid.toString();

  return wipeoutPath;
};

/**
* Deletes data in the Realtime Datastore when the accounts are deleted.
*
* @parm {functions.auth.UserRecord} data Deleted User.
*/
exports.deleteUser = (data) => {
  return admin.database().ref(buildPath(data.uid)).remove();
};

/**
* Write log into RTDB with displayName.
*
* @parm {functions.auth.UserRecord} data Deleted User.
*/
exports.writeLog = (data) => {
  return admin.database().ref(`/wipeout-log/${data.uid}`).set(data.displayName);
};

// only expose internel functions to tests.
if (process.env.NODE_ENV == 'TEST') {
  module.exports.buildPath = buildPath;
}
