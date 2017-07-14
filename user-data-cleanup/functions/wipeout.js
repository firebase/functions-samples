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

const deepcopy = require('deepcopy');
const fs = require('fs');
const PATH_SPLITTER = '/';
const request = require('request-promise');
const sjc = require('strip-json-comments');
/**
 * Initialize the wipeout library.
 * @param {object} wipeoutConfig contains the fields:
 *  'admin' module returned by require('firebase-admin')
 *  'functions' module returned by require('firebase-functions')
 *  'DB_URL' the URL of the project's Firebase Realtime Database
 *  'WIPEOUT_UID' typically '$WIPEOUT_UID'; change in case of conflict
 *  'WRITE_SIGN': should be '.write',
 *  'PATH_REGEX': should be /^\/?$|(^(?=\/))(\/(?=[^/\0])[^/\0]+)*\/?$/
 */
exports.initialize = wipeoutConfig => {
  global.init = Object.freeze(wipeoutConfig);
};

/**
 * Get wipeout deletion paths from wipeout_config.json,
 * or else try to infer from RTDB rules.
 *
 * @param {!string} uid User auth id.
 */
const getPaths = (uid) => {
  try {
    const config = require('./wipeout_config.json').wipeout;
    return buildPath(config, uid);
  } catch (err) {
    console.log('Failed to read local configuration.' +
      'Trying to infer from Realtime Database Security Rules...\n' +
      '(If you intended to use local configuration, ' +
      'make sure there\'s a "wipeout_config.json" file in the ' +
      'functions directory with a "wipeout" field.', err);
    return readDBRules().then((DBRules) => {
      const config = extractFromDBRules(DBRules);
      console.log('Using wipeout rules inferred from RTDB rules.');
      return buildPath(config, uid);
    }).catch(errDB => {
      console.error(
       'Could not generate wipeout config from RTDB rules.' +
       'Failed to read database', errDB);
      return Promise.reject(err);
    });
  }
};

// buid deletion paths from wipeout config
const buildPath = (config, uid) => {
  const paths = deepcopy(config);
  for (let i = 0, len = config.length; i < len; i++) {
    if (!init.PATH_REGEX.test(config[i].path)) {
      return Promise.reject('Invalid wipeout Path: ' + config[i].path);
    }
    paths[i].path = config[i].path.replace(init.WIPEOUT_UID, uid.toString());
  }
  return Promise.resolve(paths);
};

// Read database security rules using REST API.
const readDBRules = () => {
  return init.admin.credential.applicationDefault().getAccessToken()
  .then((snapshot) => {
    return snapshot.access_token;
  })
  .then((token) => {
    const rulesURL = `${init.DB_URL}/.settings/rules.json?access_token=${token}`;
    return request(rulesURL);
  })
  .catch((err) => {
    console.error(err, 'Failed to read RTDB rule.');
    return Promise.reject(err);
  });
};


// extract wipeout rules from RTDB rules.
const extractFromDBRules = (DBRules) => {
  const rules = JSON.parse(sjc(DBRules));
  const inferredRules = inferWipeoutRule(rules);
  return inferredRules;
};

// BFS traverse of RTDB rules, check all the .write rules
// for potential user data path.
const inferWipeoutRule = (obj) => {
  const queue = [];
  const pathQueue = [];
  const retRules = [];
  queue.push(obj);
  pathQueue.push([]);

  while (queue.length > 0) {
    const node = queue.shift();
    const path = pathQueue.shift();

    if (typeof node === 'object') {
      const keys = Object.keys(node);
      if (keys.includes(init.WRITE_SIGN)) {
        const userPath = checkWriteRules(path, node[init.WRITE_SIGN]);
        if (typeof userPath !== 'undefined') {
          retRules.push({'path': userPath});
        }
      } else {
        for (let i = 0, len = keys.length; i < len; i++) {
          const newPath = path.slice();
          newPath.push(keys[i]);
          pathQueue.push(newPath);
          queue.push(node[keys[i]]);
        }
      }
    }
  }
  return retRules;
};

// check if the write rule indicates only the specific user has write
// access to the path. If so, the path contains user data.
// TODO: currently hard coded criteria, will change very soon.
const checkWriteRules = (currentPath, rule) => {
  if ((rule === 'auth.uid === $uid') || (rule === 'auth.uid == $uid') ||
     (rule === '$uid === auth.uid') || (rule === '$uid == auth.uid')) {

    const UID = '$uid';
    const location = currentPath.indexOf(UID);
    if (location === -1) {
      console.error('User ID not in path');
      return;
    } else {
      if (currentPath[0] !== 'rules') {
        console.error('Mistake in current path, should start with "rules"');
        return undefined;
      }
      currentPath[0] = '';
      currentPath[location] = init.WIPEOUT_UID;
      return currentPath.join(PATH_SPLITTER);
    }
  }
};

/**
 * Deletes data in the Realtime Datastore when the accounts are deleted.
 *
 * @param {!Object[]} deletedPaths list of path objects.
 */
const deleteUser = (deletePaths) => {
  const deleteTasks = [];
  for (let i = 0; i < deletePaths.length; i++) {
    deleteTasks.push(init.admin.database().ref(deletePaths[i].path).remove());
  }
  return Promise.all(deleteTasks);
};

/**
 * Write log into RTDB with displayName.
 *
 * @param {!functions.auth.UserRecord} data Deleted User.
 */
const writeLog = (data) => {
  return init.admin.database().ref(`/wipeout-history/${data.uid}`)
      .set(init.admin.database.ServerValue.TIMESTAMP);
};

/**
 * Deletes data in the Realtime Datastore when the accounts are deleted.
 * Log into RTDB after successful deletion.
 *
 */
exports.cleanupUserData = () => {
  return init.functions.auth.user().onDelete(event => {
    return getPaths(event.data.uid)
        .then(deletePaths => deleteUser(deletePaths))
        .then(() => writeLog(event.data));
  });
};


// only expose internel functions to tests.
if (process.env.NODE_ENV === 'TEST') {
  module.exports.buildPath = buildPath;
  module.exports.checkWriteRules = checkWriteRules;
  module.exports.extractFromDBRules = extractFromDBRules;
  module.exports.inferWipeoutRule = inferWipeoutRule;
  module.exports.readDBRules = readDBRules;
  module.exports.deleteUser = deleteUser;
  module.exports.writeLog = writeLog;

}
