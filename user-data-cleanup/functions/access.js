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

const exp = require('./expression');

function Access(status, list) {
  if (!([exp.NO_ACCESS, exp.SINGLE_ACCESS, exp.MULT_ACCESS].indexOf(status) > -1)) {
    throw 'Not a valid access status.';
  }
  this.accessStatus = status;
  if (status !== exp.SINGLE_ACCESS) {
    this.variableList = [];
    return;
  }
  if (!checkVariableList(list)) {
    throw 'Not a valid list of variable for single access.';
  }
  this.variableList = list;
}

/**
 * Helper function, validity checking for variable list.
 * @param list input list, should be list of strings
 */
const checkVariableList = list =>
    Array.isArray(list) && list.length > 0 && list.every(variable =>
    typeof variable === 'string');

/**
 * Getter of access status
 */
Access.prototype.getAccessStatus = function() {
  return this.accessStatus;
};

/**
 * Getter of access pattern
 * @param path path to the current node, list of strings
 * @param placeHolder aut palceholder, e.g. #WIPEOUT_UID
 */
Access.prototype.getAccessPattern = function(path, placeHolder) {
  if (path[0] !== 'rules') {
    throw `A valid path starts with 'rules'`;
  }
  const result = path.map(cur => {
    return this.getVariableList().indexOf(cur) > -1 ? placeHolder : cur;
  });
  result[0] = '';
  return result.join('/');
};

Access.prototype.getVariableList = function() {
  return this.variableList;
};

/**
 * Create access object from expression object.
 * The access object describes the access pattern of the expression
 * @param expression input expression object
 * @param currentPath path to the current node, list of strings
 */
Access.fromExpression = function(expression, currentPath) {
  const status = expression.getAccessNumber();
  if ((status === exp.NO_ACCESS) || (status === exp.MULT_ACCESS)) {
    return new Access(status, []);
  }
  const authVars = expression.getConjunctionLists()[0];
  const validVariable = authVars.every(cur => currentPath.indexOf(cur) > -1);

  if (!validVariable) {
    throw 'Write rule is using unknown variable';
  }
  return new Access(status, authVars);
};

/**
 * Get access status of the node, according to access of the
 * rule at the location and access status of its ancestor
 * @param ancestor access object of ancestor of the current node
 * @param ruleAccess access object of write rule at the current place
 */
Access.nodeAccess = function(ancestor, ruleAccess) {
  const ancestorAcc = ancestor.getAccessStatus();
  const ruleAcc = ruleAccess.getAccessStatus();
  if (ancestorAcc === exp.MULT_ACCESS) {
    return new Access(exp.MULT_ACCESS,[]);
  }
  if (ancestorAcc === exp.NO_ACCESS) {
    return ruleAccess;
  }
  if (ancestorAcc === exp.SINGLE_ACCESS) {
    if (ruleAcc === exp.NO_ACCESS) {
      return ancestor;
    }
    if (ruleAcc === exp.MULT_ACCESS) {
      return new Access(exp.MULT_ACCESS, []);
    }
    if (ruleAcc === exp.SINGLE_ACCESS) {
      const noAdditionalAccess = ancestor.getVariableList().every(variable =>
          ruleAccess.getVariableList().indexOf(variable) > -1);

      if (noAdditionalAccess) {
        return ancestor;
      }
      return new Access(exp.MULT_ACCESS,[]);
    }
  }
};

module.exports = Access;
