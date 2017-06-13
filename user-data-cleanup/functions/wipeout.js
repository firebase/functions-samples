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
'use strict';

const admin = require('firebase-admin');
const functions = require('firebase-functions');
const PATH_SPLITTER = '/';
const dbURL = functions.config().firebase.databaseURL;
const request = require('request-promise');

admin.initializeApp(functions.config().firebase);


const readDBRules = () => {
  admin.credential.applicationDefault().getAccessToken().then((snapshot) => {
    return snapshot.access_token;
  }).then((token) => {
    const rulesURL = `${dbURL}/.settings/rules.json?access_token=${token}`;
    return request(rulesURL);
  }).then((body) => {
    console.log(body);
    return body;
  }).catch((err) => console.log(err));
};

// extract wipeout rules from RTDB rules.
const extractfromDBRules = () => {
//
};

// Get wiepout configration from wipeout_config.json or CLI.
// If both set, use CLI config.
const getConfig = () => {
  try {
      return functions.config().wipeout;
  }
  catch (err) {
    try {
      return require('./wipeout_config.json');
    } 
    catch (err) {
      console.log("No wipeout configuration specified");
      console.log("Inferring from RTDB rules");
      return  readDBRules().then((DBRules) => extractfromDBRules(DBRules));
    }
  }
};

const buildPath = (uid) => {
  const dataPath = getConfig().path;
  const dataPathSplit = dataPath.split(PATH_SPLITTER);
  const wipeoutPath = dataPathSplit.join(PATH_SPLITTER) +
      (dataPathSplit[dataPathSplit.length - 1] === '' ? '' : PATH_SPLITTER) +
      uid.toString();

  return wipeoutPath;
};

/**
 * Deletes data in the Realtime Datastore when the accounts are deleted.
 *
 * @param {!functions.auth.UserRecord} data Deleted User.
 */
exports.deleteUser = (data) => {
  return admin.database().ref(buildPath(data.uid)).remove();
};

/**
 * Write log into RTDB with displayName.
 *
 * @param {!functions.auth.UserRecord} data Deleted User.
 */
exports.writeLog = (data) => {
  return admin.database().ref(`/wipeout-history/${data.uid}`).set('Success');
};

// only expose internel functions to tests.
if (process.env.NODE_ENV == 'TEST') {
  module.exports.buildPath = buildPath;
  module.exports.readDBRules = readDBRules;
}
