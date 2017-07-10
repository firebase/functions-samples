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
const jsep = require('jsep');
const PATH_SPLITTER = '/';
const request = require('request-promise');
const sjc = require('strip-json-comments');

const WIPEOUT_UID = '#WIPEOUT_UID';
const WRITE_SIGN = '.write';
const PATH_REGEX = /^\/?$|(^(?=\/))(\/(?=[^/\0])[^/\0]+)*\/?$/;
const BOOK_KEEPING_PATH = '/wipeout';

const Expression = require('./expression.js');
const TRUE = 'true';
const FALSE = 'false';
const UNDEFINED = 'undefined';

const NO_ACCESS = 0;
const SINGLE_ACCESS = 1;
const MULT_ACCESS = 2;


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
  return init.db.ref(`${BOOK_KEEPING_PATH}/confirm`).set(false);

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

// buid deletion paths from wipeout config
const buildPath = (config, uid) => {
  const paths = deepcopy(config);
  for (let i = 0, len = config.length; i < len; i++) {
    if (!PATH_REGEX.test(config[i].path)) {
      return Promise.reject('Invalid wipeout Path: ' + config[i].path);
    }
    paths[i].path = config[i].path.replace(WIPEOUT_UID, uid.toString());
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

// extract wipeout rules from RTDB rules.
const extractFromDBRules = DBRules => {
  const rules = JSON.parse(sjc(DBRules));
  const inferredRules = inferWipeoutRule(rules);
  return inferredRules;
};

// BFS traverse of RTDB rules, check all the .write rules
// for potential user data path.
const inferWipeoutRule = obj => {
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
      if (keys.includes(WRITE_SIGN)) {
        const userPath = checkWriteRules(path, node[WRITE_SIGN]);
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

// check memeber expression of candidate auth.id
const checkMember = obj => {
  return obj.type === 'MemberExpression' && obj.object.name === 'auth' &&
      obj.property.name === 'uid';
};

// get the DNF expression asscociated with auth.uid
const getExpression = obj => {
  if (obj.type === 'Literal') {
    return obj.raw === 'true' ? new Expression(TRUE,[]) : new Expression(TRUE,[]);
  } else if (obj.type === 'Identifier') {
    return obj.name[0] === '$' ? new Expression(UNDEFINED, [[obj.name]]) : new Expression(FALSE,[]);
  } else { return new Expression(TRUE,[]);}
};

// check binary expressions for candidate auth.uid == ?
function checkBinary(obj) {
  if (obj.type === 'BinaryExpression' && (obj.operator === '==' || obj.operator === '===')) {
    if (checkMember(obj.left)) { return getExpression(obj.right);}
    if (checkMember(obj.right)) { return getExpression(obj.left);}
  }
  return new Expression(TRUE,[]);
}

// check true or false literals
function checkLiteral(obj) {
  if (obj.type === 'Literal') {
    if (obj.raw === 'true') {
      return new Expression(TRUE,[]);
    } else if (obj.raw === 'false') {
      return new Expression(FALSE,[]);
    } else {throw 'Literals else than true or false are not supported';}
  }
}

// check (nested) logic expressions
function checkLogic(obj) {
  if (obj.type === 'BinaryExpression') {
    return checkBinary(obj);// also check unary literals
  } else if (obj.type === 'Literal') {
    return checkLiteral(obj);
  } else if (obj.type === 'LogicalExpression') {
    const left = checkLogic(obj.left);
    const right = checkLogic(obj.right);
    //console.log(obj.operator,left, right);

    if (obj.operator === '||') {
      return Expression.or(left, right);
    } else if (obj.operator === '&&') {
      return Expression.and(left, right);
    }
  } else {
    return new Expression(TRUE, []);
  }
}

// check if the write rule indicates only the specific user has write
// access to the path. If so, the path contains user data.
// TODO(dzdz): currently hard coded criteria, will change very soon.
function checkWriteRules(currentPath, rule) {
  let ruleTree;
  try {
    ruleTree = jsep(rule);
  } catch (err) {
    //console.log(`jsep failed to parse the rule ${rule}. Rulw ignored`, err);
    return; // ignore write rules which couldn't be parased by jsep/.
  }

  const resultExp = checkLogic(ruleTree);

  if (resultExp.getAccessNumber() === SINGLE_ACCESS) {
    const authVars = resultExp.getConjunctionList()[0];
    authVars.every((cur) => {
      const location = currentPath.indexOf(cur);
      if (location === -1) {
        throw 'Write rule is using unknown variable ' + cur;
      } else {
        currentPath[location] = WIPEOUT_UID;
        return true;
      }
    });
    if (currentPath[0]) {
      currentPath[0] = '';
      return currentPath.join(PATH_SPLITTER);
    } else { throw `Mistake in current path, should start with 'rules'`;}
  } else { return;}
}


/**
 * Deletes data in the Realtime Datastore when the accounts are deleted.
 *
 * @param {!Object[]} deletePaths list of path objects.
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
 * @param {!functions.auth.UserRecord} data Deleted User.
 * TODO(dzdz): check for current wipeout path
 */
const writeLog = data => {
  return init.db.ref(`${BOOK_KEEPING_PATH}/history/${data.uid}`)
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
        .ref(`${BOOK_KEEPING_PATH}/rules`).once('value');
    const confirmPromise = init.db
        .ref(`${BOOK_KEEPING_PATH}/confirm`).once('value');
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
  return init.https.onRequest((req,res) => {
    return getConfig().then(config => {
      return init.db.ref(`${BOOK_KEEPING_PATH}/rules`)
          .set(config).then(() => {
            const content = `Please verify the wipeout rules. <br>
If correct, click the 'Confirm' button below. <br>
If incorrect, please modify functions/wipeout_config.json
and deploy again. <br> <br> ${JSON.stringify(config)} 
<form action='/confirmWipeoutConfig' method='post'>
<input type='submit' value='Confirm' name ='confirm'></form>`;

            res.send(content);
          });
    });
  });
};


/**
 * Give developers the ability to confirm the wipeout rules through a URL
 *
 */
exports.confirmWipeoutConfig = () => {
  return init.https.onRequest((req,res) => {
      return init.db.ref(`${BOOK_KEEPING_PATH}/confirm`).set(true)
          .then(() => res.send('Confirm sent'));
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
