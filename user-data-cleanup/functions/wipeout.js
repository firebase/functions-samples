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

exports.buildPath = (uid) => {
  const dataPath = functions.config().wipeout.path;
  const dataPathSplit = dataPath.split('/');
  const wipeoutPath = dataPathSplit.join('/') +  (dataPathSplit[dataPathSplit.length -1] ==='' ? '' : '/') + uid.toString();
 
  return wipeoutPath;
}

exports.writeLog = (data) => {
  const uid = data.uid;
  const displayName = data.displayName;
  return admin.database().ref(`/wipeout-log/${uid}`).set(displayName);
}

exports.deleteUser = (data) => {
  const uid = data.uid;
  const wipeoutPath =this.buildPath(uid);
  return admin.database().ref(wipeoutPath).remove();
}
