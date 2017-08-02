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

const common = require('./common');
const deepcopy = require('deepcopy');
const request = require('request-promise');
const rules = require('./parse_rule');
const sjc = require('strip-json-comments');

const WRITE_SIGN = '.write';
const PATH_REGEX = /^\/?$|(^(?=\/))(\/(?=[^/\0])[^/\0]+)*\/?$/;

const exp = require('./expression');
const Access = require('./access');

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
  return init.db.ref(`${common.BOOK_KEEPING_PATH}/confirm`).set(false);
};

// Get wipeout configuration from wipeout_config.json,
// or else try to infer from RTDB rules.
const getConfig = () => {
  try {
    const config = require('./wipeout_config.json').wipeout;
    return Promise.resolve(config);
  } catch (err) {
    console.log(`Failed to read local configuration.
Trying to infer from Realtime Database Security Rules...

(If you intended to use local configuration,
make sure there's a 'wipeout_config.json' file in the
functions directory with a 'wipeout' field.`, err);
    return readDBRules().then(DBRules => {
      const config = extractFromDBRules(DBRules);
      console.log('Using wipeout rules inferred from RTDB rules.');
      return Promise.resolve(config);
    }).catch(errDB => {
      console.error(
       'Could not generate wipeout config from RTDB rules.' +
       'Failed to read database', errDB);
      return Promise.reject(err);
    });
  }
};

// Buid deletion paths from wipeout config
const buildPath = (config, uid) => {
  const paths = deepcopy(config);
  for (let i = 0, len = config.length; i < len; i++) {
    if (!PATH_REGEX.test(config[i].path)) {
      return Promise.reject('Invalid wipeout Path: ' + config[i].path);
    }
    paths[i].path = config[i].path.replace(common.WIPEOUT_UID, uid.toString());
  }
  return Promise.resolve(paths);
};

// Read database security rules using REST API.
const readDBRules = () => {
  return init.credential.getAccessToken()
  .then(snapshot => {
    return snapshot.access_token;
  })
  .then(token => {
    const rulesURL = `${init.DB_URL}/.settings/rules.json?` +
        `access_token=${token}`;
    return request(rulesURL);
  })
  .catch(err => {
    console.error(err, 'Failed to read RTDB rule.');
    return Promise.reject(err);
  });
};

// Extract wipeout rules from RTDB rules.
const extractFromDBRules = DBRules => {
  const rules = JSON.parse(sjc(DBRules));
  const inferredRules = inferWipeoutRule(rules);
  return inferredRules;
};

// BFS traverse of RTDB rules, check all the .write rules
// for potential user data path.
const inferWipeoutRule = tree => {
  const queue = [];
  const retRules = [];
  const initial = {
    node: tree,
    path: [],
    ancestorAccess: new Access(exp.NO_ACCESS, [])
  };
  queue.push(initial);

  while (queue.length > 0) {
    const obj = queue.shift();
    const node = obj.node;
    const path = obj.path;
    let ancestor = obj.ancestorAccess;

    if (typeof node === 'object') {
      const keys = Object.keys(node);
      if (keys.includes(WRITE_SIGN)) {

        // access status of the write rule
        const ruleAccess = rules.parseWriteRule(node[WRITE_SIGN], path);
        // access status of the node, considering ancestor.
        const nodeAccess = Access.nodeAccess(ancestor, ruleAccess);

        if (nodeAccess.getAccessStatus() === exp.MULT_ACCESS) {
          if (ancestor.getAccessStatus() === exp.SINGLE_ACCESS) {
            retRules.push(
            {'except': nodeAccess.getAccessPattern(path, common.WIPEOUT_UID)});
          }
          continue; // Won't go into subtree of MULT_ACCESS nodes

        } else if (nodeAccess.getAccessStatus() === exp.SINGLE_ACCESS) {
          if (ancestor.getAccessStatus() === exp.NO_ACCESS) {
            const inferredRule = {
                'path': nodeAccess.getAccessPattern(path, common.WIPEOUT_UID)};
            if (typeof nodeAccess.getCondition() !== 'undefined') {
              inferredRule.condition = nodeAccess.getCondition();
            }
            retRules.push(inferredRule);
          }
        }
        // Update ancestor for children
        ancestor = nodeAccess;
      }

      for (let i = 0, len = keys.length; i < len; i++) {
        const newPath = path.slice();
        newPath.push(keys[i]);
        const newObj = {
          node: node[keys[i]],
          path: newPath,
          ancestorAccess: ancestor
        };
        queue.push(newObj);
      }
    }
  }
  return retRules;
};




/**
 * Deletes data in the Realtime Datastore when the accounts are deleted.
 *
 * @param deletePaths list of path objects.
 */
const deleteUser = deletePaths => {
  const deleteTasks = [];
  for (let i = 0; i < deletePaths.length; i++) {
    deleteTasks.push(init.db.ref(deletePaths[i].path).remove());
  }
  return Promise.all(deleteTasks);
};

/**
 * Write log into RTDB with displayName.
 *
 * @param data Deleted User.
 * TODO(dzdz): check for current wipeout path
 */
const writeLog = data => {
  return init.db.ref(`${common.BOOK_KEEPING_PATH}/history/${data.uid}`)
      .set(init.serverValue.TIMESTAMP);
};

/**
 * Deletes data in the Realtime Datastore when the accounts are deleted.
 * Log into RTDB after successful deletion.
 *
 */
exports.cleanupUserData = () => {
  return init.users.onDelete(event => {
    const configPromise = init.db
        .ref(`${common.BOOK_KEEPING_PATH}/rules`).once('value');
    const confirmPromise = init.db
        .ref(`${common.BOOK_KEEPING_PATH}/confirm`).once('value');
    return Promise.all([configPromise, confirmPromise])
        .then((snapshots) => {
      const config = snapshots[0].val();
      const confirm = snapshots[1].val();
      if (!snapshots[0].exists() || !confirm) {
        return Promise.reject('No config or not confirmed by developers. ' +
          'No data deleted at user deletion.');
      } else {
        return Promise.resolve(config);
      }
    })
    .then(config => buildPath(config, event.data.uid))
    .then(deletePaths => deleteUser(deletePaths))
    .then(() => writeLog(event.data));
  });
};


/**
 * Give developers the ability to see the wipeout rules through a URL
 *
 */
exports.showWipeoutConfig = () => {
  return init.https.onRequest((req, res) => {
    if (req.method === 'GET') {
      return getConfig().then(config => {
        return init.db.ref(`${common.BOOK_KEEPING_PATH}/rules`)
            .set(config).then(() => {
              const content = `Please verify the wipeout rules. <br>
If correct, click the 'Confirm' button below. <br>
If incorrect, please modify functions/wipeout_config.json 
and deploy again. <br> <br> ${JSON.stringify(config)} 
<form action='#' method='post'>
<input type='submit' value='Confirm' name ='confirm'></form>`;

              res.send(content);
            });
      });
    } else if ((req.method === 'POST') && req.body.confirm === 'Confirm') {
      return init.db.ref(`${common.BOOK_KEEPING_PATH}/confirm`).set(true)
          .then(() => res.send('Confirm sent, Wipeout function activated.'));
    }
  });
};

// Only expose internel functions to tests.
if (process.env.NODE_ENV === 'TEST') {
  module.exports.buildPath = buildPath;
  module.exports.extractFromDBRules = extractFromDBRules;
  module.exports.inferWipeoutRule = inferWipeoutRule;
  module.exports.readDBRules = readDBRules;
  module.exports.deleteUser = deleteUser;
  module.exports.writeLog = writeLog;
}
