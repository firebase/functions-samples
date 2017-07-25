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
  if ([exp.NO_ACCESS, exp.SINGLE_ACCESS, exp.MULT_ACCESS].indexOf(status) > -1) {
    this.accessStatus = status;
    if (status === exp.SINGLE_ACCESS) {
      if (Access.checkVariableList(list)) {
        this.variableList = list;
      } else {throw 'Not a valid list of variable for single access.';}
    } else {this.variableList = [];}
  } else {throw 'Not a valid access status.';}
}

Access.prototype.getAccessStatus = function() {
  return this.accessStatus;
};

Access.prototype.getAccessPattern = function(path, placeHolder){
  if (path[0] ==='rules'){
    path[0] = '';
    return path.map(cur => {
      return this.getVariableList().indexOf(cur) > -1 ? placeHolder : cur;
    }).join('/');
  } else {throw `A valid path starts with 'rules'`;}

};

Access.prototype.getVariableList = function() {
  return this.variableList;
};

Access.checkVariableList = function(list) {
  return Array.isArray(list) && list.length > 0 && list.every(variable => {
    return typeof variable === 'string';
  });
};

// get access object from expression object and check variable validty with 
// currentPath. 
Access.fromExpression = function(expression, currentPath) {
  const status = expression.getAccessNumber();
  if ((status === exp.NO_ACCESS) || (status === exp.MULT_ACCESS)) {
    return new Access(status, []);
  } else {
    const authVars = expression.getConjunctionLists()[0];
    const validVariable = authVars.every((cur) => {
      return currentPath.indexOf(cur) > -1;
    });
    if (validVariable) {
      return new Access(status, authVars);
    } else {throw 'Write rule is using unknown variable';}
  }
};

// Get access status of the node, according to access of the 
// rule at the location and access status of its ancestor
Access.nodeAccess = function(ancestor, ruleAccess) {
  const accessAnc = ancestor.getAccessStatus();
  const accessRule = ruleAccess.getAccessStatus();
  if (accessAnc === exp.MULT_ACCESS) {
    return new Access(exp.MULT_ACCESS,[]);

  } else if (accessAnc === exp.NO_ACCESS) {
    return ruleAccess;

  } else if (accessAnc === exp.SINGLE_ACCESS) {
    if (accessRule === exp.NO_ACCESS) {
      return ancestor;

    } else if (accessRule === exp.MULT_ACCESS) {
      return new Access(exp.MULT_ACCESS, []);

    } else if (accessRule === exp.SINGLE_ACCESS) {
      const noAdditionalAccess = ancestor.getVariableList().every(variable => {
        return ruleAccess.getVariableList().indexOf(variable) > -1;
      });
      if (noAdditionalAccess) {
        return ancestor;
      } else {return new Access(exp.MULT_ACCESS,[]);}

    }
  }
};

module.exports = Access;
