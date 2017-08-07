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
const jsep = require('jsep');
const WRITE_SIGN = '.write';
const PATH_REGEX = /^\/?$|(^(?=\/))(\/(?=[^/\0])[^/\0]+)*\/?$/;

const exp = require('./expression');
const Access = require('./access');
const functions = require('firebase-functions');


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
Trying to infer from Realtime Database Security Rules...(If you intended to use local configuration,
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

// Buid deletion paths from wipeout config by swapping
// in the user authentication id.
const buildPath = (config, uid) => {
  const paths = [];
  const conditions = [];
  for (let i = 0; i < config.length; i++) {
    if (!PATH_REGEX.test(config[i].path)) {
      return Promise.reject('Invalid wipeout Path: ' + config[i].path);
    }
    const re = new RegExp(common.WIPEOUT_UID, 'g');

    paths.push({'path':config[i].path.replace(re, uid.toString())});

    // checkCondition returns a promise.
    conditions.push(checkCondition(config[i].condition, uid));
  }
  return Promise.all(conditions).then(res => {
    for (let i = 0; i < res.length; i++) {
      if (!res[i]) {
        paths[i] = undefined;
      }
    }
    return Promise.resolve(paths.filter(item => typeof item !== 'undefined'));
  });
};

/**
 * Helper function, extract path from argument list
 * @param list input list
 * @return path extracted from the argument list
 */
const extractPath = list => {
  const ret = [''];
  for (let i = 1; i < list.length; i++) {
    if (list[i].type === 'Identifier') {
      ret.push(list[i].name);
    } else if (list[i].type === 'Literal') {
      ret.push(list[i].value);
    }
  }
  return ret.join('/');
};

/**
 * Helper function, Evaluate operand in conditions
 * @param obj input object of the operand
 * @return Promise resolved with the value of the operand
 */
const evalOperand = obj => {
  switch (obj.type) {
    case 'Identifier':
      return Promise.resolve(obj.name);

    case 'Literal':
      return Promise.resolve(obj.value);

    case 'CallExpression':
      switch (obj.callee.name) {
        case 'exists':
          return evalExists(obj);
        case 'val':
          return evalVal(obj);
      }
  }
};

/**
 * Evaluates exists() methods in conditions, check the DB for existence.
 * @param obj input object of the operand
 * @return Promise resolved with true or false
 */
const evalExists = obj => {
  if (obj.callee.name !== 'exists') {
    throw 'Expect exists()';
  }
  const loc = extractPath(obj.arguments);
  var ref = init.db.ref(loc);
  return ref.once('value').then(snapshot => snapshot.exists());
};

/**
 * Evaluates val() methods in conditions, check the DB for data value.
 * @param obj input object of the operand
 * @return Promise resolved with query data value
 */
const evalVal = obj => {
  if (obj.callee.name !== 'val') {
    throw 'Expect val()';
  }
  const loc = extractPath(obj.arguments);
  var ref = init.db.ref(loc);
  return ref.once('value').then(snapshot => snapshot.val());
};

/**
 * Evaluates logic expressions in conditions
 * @param obj input object of the logic expression
 * @return Promise resolved with true or false value of the logic expression
 */
const evalLogic = (obj) => {
  switch (obj.type) {
    case 'Literal':
      if (obj.value !== true && obj.value !== false) {
        throw 'Unsupported Literal in condition';
      }
      return Promise.resolve(obj.value);
    case 'CallExpression':
      return evalExists(obj);

    case 'BinaryExpression':
      const leftBinary = evalOperand(obj.left);
      const rightBinary = evalOperand(obj.right);

      return Promise.all([leftBinary, rightBinary])
          .then(res => eval(`res[0].toString() ${obj.operator} res[1].toString()`));

    case 'LogicalExpression':
      const leftLogic = evalLogic(obj.left);
      const rightLogic = evalLogic(obj.right);
      if (obj.operator === '||') {
        return Promise.all([leftLogic, rightLogic])
            .then(res => (res[0] || res[1]));
      }
      if (obj.operator === '&&') {
        return Promise.all([leftLogic, rightLogic])
            .then(res => (res[0] && res[1]));
      }
      throw `Unsupported logic operation in condition`;
    default:
      throw 'Unsuppotted logic expression';
  }
};

const checkCondition = (condition, uid) => {
  if (typeof condition === 'undefined') {
    return Promise.resolve(true);
  }
  const re = new RegExp(common.WIPEOUT_UID, 'g');
  const cond = condition.toString().replace(re, '\'' + uid.toString() + '\'');
  const obj = jsep(cond);
  return evalLogic(obj);
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
            {'except': nodeAccess.getAccessPattern(path)['path']});
          }
          continue; // Won't go into subtree of MULT_ACCESS nodes

        } else if (nodeAccess.getAccessStatus() === exp.SINGLE_ACCESS) {
          if (ancestor.getAccessStatus() === exp.NO_ACCESS) {
            retRules.push(nodeAccess.getAccessPattern(path));
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
    if (typeof deletePaths[i] !== 'undefined') {
      deleteTasks.push(init.db.ref(deletePaths[i].path).remove());
    }
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
  return functions.https.onRequest((req, res) => {
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
  module.exports.checkCondition = checkCondition;
}
