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

const ejs = require('ejs');
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
};


/**
 * Get wipeout configuration from wipeout_config.json,
 * or else try to infer from RTDB rules.
 *
 * @return Wipeout rules(config)
 */
const getConfig = () => {
  try {
    const config = require('./wipeout_config.json').wipeout;
    return Promise.resolve({rules: config, source: 'LOCAL'});
  } catch (err) {
    console.log(`Failed to read local configuration.
Trying to infer from Realtime Database Security Rules...(If you intended to use local configuration,
make sure there's a 'wipeout_config.json' file in the
functions directory with a 'wipeout' field.`, err);
    return readDBRules().then(DBRules => {
      const config = extractFromDBRules(DBRules);
      console.log('Using wipeout rules inferred from RTDB rules.');
      return Promise.resolve({rules: config, source: 'AUTO'});
    }).catch(errDB => {
      console.error(
       'Could not generate wipeout config from RTDB rules.' +
       'Failed to read database', errDB);
      return Promise.reject(err);
    });
  }
};


/**
 * Preprocessing of wipeout config at execution time
 * Swap any authentication place holder with uid of deleted account.
 *
 * @param configs input list of config
 * @param uid autentication id of deleted account
 * @return configs after processing
 */
const preProcess = (configs, uid) => {
  const newConfigs = deepcopy(configs);
  for (let i = 0; i < configs.length; i++) {
    if (!PATH_REGEX.test(configs[i].path)) {
      return Promise.reject('Invalid wipeout Path: ' + configs[i].path);
    }
    const re = new RegExp(common.WIPEOUT_UID, 'g');
    newConfigs[i].path = newConfigs[i].path.replace(re, uid.toString());
  }
  return newConfigs;
};


/**
 * Evaluate conditions at runtime, filter out configs with false condition,
 * remove condition field after filtering.
 *
 * @param configs input list of config
 * @param uid autentication id of deleted account
 * @return configs after filtering
 */
const filterCondition = (configs, uid) => {
  const newConfigs = deepcopy(configs);
  const candidates = [];
  // Create list of Promises returned by checkcondition()
  for (let i = 0; i < configs.length; i++) {
    candidates.push(checkCondition(configs[i].condition, uid));
    delete newConfigs[i].condition;
  }
  return Promise.all(candidates).then(res => {
    for (let i = 0; i < res.length; i++) {
      if (!res[i]) {
        newConfigs[i] = null;
      }
    }
    return newConfigs.filter(item => item !== null);
  });
};

/**
 * Evaluate authVar at execution time for a single config
 * Current only support one authVar.
 * Replace variables in path by possible values of authVar.
 * e.g. authVar $room =>['room1','room2'], input config.path = /chat/$rooms
 * A list of two configs with path '/chat/room1' and path '/chat/room2' will
 * be returned.
 *
 * @param configs input config
 * @param uid autentication id of deleted account
 * @return configs list of configs after Evaluation,
 */

const evalSingleAuthVar = (config, uid) => {
  if (config.authVar.length !== 1) {
    console.log('This version only deals with authVar with a single value');
    return []; // This config ignored.
  }
  const authVar = config.authVar[0];
  const pathList = authVar.slice(4, -1).split(',');
  const ref = init.db.ref(pathList.slice(1, -2).join('/'));
  return ref.orderByChild(pathList.slice(-1)[0]).equalTo(uid.toString())
      .once('value')
      .then(res => {
        if (!res.exists()) {
          return []; 
        }
        const obj = {[pathList.slice(-2)[0]]: Object.keys(res.val())};
        const configList = [];
        const varName = Object.keys(obj)[0];
        const varList = obj[varName];
        if (!config.path.split('/').includes(varName)) {
          return [];
        }
        for (let i = 0; i < varList.length; i++) {
          const temp = deepcopy(config);
          temp.path = config.path.replace(varName, varList[i]);
          delete temp.authVar;
          configList.push(temp);
        }
        return configList;
      });
};

/**
 * Evaluate authVar at execution time for all configs
 *
 * @param configs input list of configs
 * @param uid autentication id of deleted account
 * @return configs new list of configs
 */
const evalAuthVars = (configs, uid) => {
  const candidates = [];
  let evalConfigs = [];
  for (let i = 0; i < configs.length; i++) {
    if ('authVar' in configs[i]) {
      candidates.push(evalSingleAuthVar(configs[i], uid));
    } else {
      evalConfigs.push(configs[i]);
    }
  }
  return Promise.all(candidates).then(res => {
    for (let i = 0; i < res.length; i++) {
      evalConfigs = evalConfigs.concat(res[i]);
    }
    return evalConfigs;
  });
};


/**
 * Evaluate 'except' field at execution time for a single config
 * Current only support exceptions of one level.
 * e.g. input config.path = /chat/$rooms, config.except = /chat/$room/member,
 * and a /chat/$room directory has 3 children creator, name, member.
 * A list of two configs with path /chat/$room/creator
 * and path /chat/$room/name will be returned.
 * config.except = /chat/$room/member/groupA is a two level exception
 * and is not supported
 *
 * @param configs input config
 * @param uid autentication id of deleted account
 * @return configs list of configs after processing
 */
const evalSingleExcept = (config) => {
  const removeTail = l => l[l.length - 1] === '' ? l.slice(0, l.length - 1) : l;
  const pathList = removeTail(config.path.split('/'));
  const exceptList = removeTail(config.except.split('/'));

  if (exceptList.length - pathList > 1) {
    console.log('This version only supports single level exceptions');
    return []; // This config ingored.
  }
  const ref = init.db.ref(pathList.slice(1).join('/'));
  return ref.once('value')
      .then(res => {
        if (!res.exists()) {
          return []; 
        }
        const children = [];
        res.forEach(child => {
          children.push(child.key);
          return; // Returning true will cancel the enumeration
          });
        return children;
      })
      .then(children => {
        const exception = exceptList[exceptList.length - 1];
        if (!children.includes(exception)) {
          // return the parent path without exception
          const fakeException = deepcopy(config);
          delete fakeException.except;
          return [fakeException];
        } else {
          const configList = [];
          for (let i = 0; i < children.length; i++) {
            if (children[i] !== exception) {
              const newConfig = deepcopy(config);
              delete newConfig.except;
              newConfig.path = pathList.join('/') + `/${children[i]}`;
              configList.push(newConfig);
            }
          }
          return configList;
        }
      });
};

/**
 * Evaluate exception at execution time for all configs
 *
 * @param configs input list of configs
 * @param uid autentication id of deleted account
 * @return configs new list of configs
 */
const evalExcepts = (configs) => {
  const candidates = [];
  let evalConfigs = [];
  for (let i = 0; i < configs.length; i++) {
    if ('except' in configs[i]) {
      candidates.push(evalSingleExcept(configs[i]));
    } else {
      evalConfigs.push(configs[i]);
    }
  }
  return Promise.all(candidates).then(res => {
    for (let i = 0; i < res.length; i++) {
      evalConfigs = evalConfigs.concat(res[i]);
    }
    return evalConfigs;
  });
};

/**
 * Helper function, extract path from argument list
 *
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
 *
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
 *
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
 *
 * @param obj input object of the operand
 * @return Promise resolved with query data value 
 * or false if the data doesn't exists.
 */
const evalVal = obj => {
  if (obj.callee.name !== 'val') {
    throw 'Expect val()';
  }
  const loc = extractPath(obj.arguments);
  var ref = init.db.ref(loc);
  return ref.once('value').then(snapshot => {

    if (snapshot.exists()){
      return snapshot.val();
    }
    return false;
  });
};

/**
 * Evaluates logic expressions in conditions
 *
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
          .then(res => eval(`res[0].toString() \
${obj.operator} res[1].toString()`));

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


/**
 * Check a condition at execution time
 *
 * @param obj condition
 * @param uid autentication id of deleted account
 * @return true or false value of the condition
 */
const checkCondition = (condition, uid) => {
  if (typeof condition === 'undefined') {
    return Promise.resolve(true);
  }
  const re = new RegExp(common.WIPEOUT_UID, 'g');
  const cond = condition.toString().replace(re, '\'' + uid.toString() + '\'');
  const obj = jsep(cond);
  return evalLogic(obj);
};

/**
 * Read database security rules using REST API.
 *
 * @return database security rules
 */
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

/**
 * Parse database security rules and extract wipeout rules(user data location).
 *
 * @param DBRules database security rules in string form
 * @return wipeout rules
 */
const extractFromDBRules = DBRules => {
  const rules = JSON.parse(sjc(DBRules));
  const inferredRules = inferWipeoutRule(rules);
  return inferredRules;
};


/**
 * Infer wipeout rules from databse security rules by traversing the rules tree
 * and analysis the write rules.
 *
 * @param DBRules database security rules as a tree-structured json object
 * @return wipeout rules
 */
const inferWipeoutRule = tree => {
  const queue = [];
  const retRules = [];
  const initial = {
    node: tree,
    path: [],
    ancestorAccess: new Access(exp.NO_ACCESS, []),
    ancestorPath: ''
  };
  queue.push(initial);

  while (queue.length > 0) {
    const obj = queue.shift();
    const node = obj.node;
    const path = obj.path;
    let ancestor = obj.ancestorAccess;
    let ancestorPath = obj.ancestorPath;

    if (typeof node === 'object') {
      const keys = Object.keys(node);
      if (keys.includes(WRITE_SIGN)) {

        // access status of the write rule
        const ruleAccess = rules.parseWriteRule(node[WRITE_SIGN], path);
        // access status of the node, considering ancestor.
        const nodeAccess = Access.nodeAccess(ancestor, ruleAccess);

        if (nodeAccess.getAccessStatus() === exp.MULT_ACCESS) {
          if (ancestor.getAccessStatus() === exp.SINGLE_ACCESS) {
            const ancestorConfig = retRules
                .filter(o => o.path === ancestorPath);
            const p = path.slice();
            p[0] = '';
            ancestorConfig[0].except = p.join('/');
          }
          continue; // Won't go into subtree of MULT_ACCESS nodes

        } else if (nodeAccess.getAccessStatus() === exp.SINGLE_ACCESS) {
          if (ancestor.getAccessStatus() === exp.NO_ACCESS) {
            retRules.push(nodeAccess.getAccessPattern(path));
            ancestorPath = nodeAccess.getAccessPattern(path)['path'];
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
          ancestorAccess: ancestor,
          ancestorPath: ancestorPath
        };
        queue.push(newObj);
      }
    }
  }
  return retRules;
};

/**
 * Remove trailing free variables (variables starting with $) in paths.
 * Ignore any configs which still have free variables afterwards.
 *
 * @param configs input configurations
 * @return configs with (multiple) tailing free variables removed.
 */
const removeFreeVars = configs => {
  const newConfigs = [];
  for (let i = 0; i < configs.length; i++) {
    const pathList = configs[i].path.split('/');
    let j = pathList.length - 1;
    while (j > 0 && (pathList[j].startsWith('$') || pathList[j] === '')) {
      j = j - 1;
    }
    const newPath = pathList.slice(0, j + 1).join('/');
    if (!newPath.includes('$') && newPath !== '') {
      newConfigs.push({path: newPath});
    }
  }
  return newConfigs;
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
  return Promise.all(deleteTasks).then(() => deletePaths);
};

/**
 * Write log into RTDB with timestamp and deleted paths.
 *
 * @param data Deleted User.
 */
const writeLog = (data, paths) => {
  return init.db.ref(`${common.BOOK_KEEPING_PATH}/history/${data.uid}`)
      .set({timestamp: init.serverValue.TIMESTAMP, paths: paths});
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
    .then(configs => {
      const newConfigs = preProcess(configs, event.data.uid);
      return filterCondition(newConfigs, event.data.uid);
    })
    .then(configs => evalAuthVars(configs, event.data.uid))
    .then(configs => evalExcepts(configs))
    .then(configs => removeFreeVars(configs))
    .then(deletePaths => deleteUser(deletePaths))
    .then(paths => writeLog(event.data, paths));
  });
};


/**
 * Give developers the ability to see the wipeout rules through a URL
 * Pages rendered by EJS.
 *
 */
exports.showWipeoutConfig = () => {
  return functions.https.onRequest((req, res) => {
    if (req.method === 'GET') {
      return getConfig().then(configs => {
        return init.db.ref(`${common.BOOK_KEEPING_PATH}/rules`)
            .set(configs.rules).then(() => {
              const sourceDict = {
                'LOCAL': 'loaded from local wipeout config',
                'AUTO': 'generated by the library from security rules'
              };
              ejs.renderFile('template.ejs',
              {configs: configs.rules, source: sourceDict[configs.source]},
              (err, html) => res.send(html));
            });
      });
    } else if ((req.method === 'POST')) {
      if (req.body.confirm === 'Confirm') {
        return init.db.ref(`${common.BOOK_KEEPING_PATH}/confirm`).set(true)
            .then(() => init.db.ref(`${common.BOOK_KEEPING_PATH}/rules`)
            .once('value').then(snapshot => {
              ejs.renderFile('template_confirm.ejs', {configs: snapshot.val()},
               (err, html) => res.send(html));
            }));
      } else if (req.body.confirm === 'Reset') {
          return init.db.ref(`${common.BOOK_KEEPING_PATH}/confirm`).set(false)
              .then(() => res.send(`Initialize complete.
 Remember to verify and confirm the wipeout rules to activate the library`));
      }
    }
  });
};



// Only expose internel functions to tests.
if (process.env.NODE_ENV === 'TEST') {
  module.exports.filterCondition = filterCondition;
  module.exports.extractFromDBRules = extractFromDBRules;
  module.exports.inferWipeoutRule = inferWipeoutRule;
  module.exports.readDBRules = readDBRules;
  module.exports.deleteUser = deleteUser;
  module.exports.writeLog = writeLog;
  module.exports.checkCondition = checkCondition;
  module.exports.evalSingleAuthVar = evalSingleAuthVar;
  module.exports.evalAuthVars = evalAuthVars;
  module.exports.removeFreeVars = removeFreeVars;
  module.exports.preProcess = preProcess;
  module.exports.evalSingleExcept = evalSingleExcept;
  module.exports.evalExcepts = evalExcepts;
}
