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

//parsing write rules, TODO(dzdz): rename this module?
const exp = require('./expression');
const Expression = exp.Expression;
const jsep = require('jsep');
const Access = require('./access');

// check memeber expression of candidate auth.id
const checkMember = obj =>
    obj.type === 'MemberExpression' && obj.object.name === 'auth' &&
      obj.property.name === 'uid';

// get the DNF expression asscociated with auth.uid
const getExpression = obj => {
  if (obj.type === 'Literal') {
    return obj.raw === 'true' ?
        new Expression(exp.TRUE,[]) : new Expression(exp.FALSE,[]);
  }
  if (obj.type === 'Identifier') {
    return obj.name[0] === '$' ?
        new Expression(exp.UNDEFINED, [[obj.name]]) :
        new Expression(exp.FALSE,[]);
  }
  return new Expression(exp.TRUE,[]);// may contain data references.
};

// check binary expressions for candidate auth.uid == ?
function checkBinary(obj) {
  if (obj.type === 'BinaryExpression' &&
      (obj.operator === '==' || obj.operator === '===')) {
    if (checkMember(obj.left)) {
      return getExpression(obj.right);
    }
    if (checkMember(obj.right)) {
      return getExpression(obj.left);
    }
  }
  return new Expression(exp.TRUE,[]);
}

// check true or false literals
function checkLiteral(obj) {
  if (obj.type === 'Literal') {
    if (obj.raw === 'true') {
      return new Expression(exp.TRUE,[]);
    }
    if (obj.raw === 'false') {
      return new Expression(exp.FALSE,[]);
    }
    throw 'Literals else than true or false are not supported';
  }
}

// check (nested) logic expressions
function checkLogic(obj) {
  if (obj.type === 'BinaryExpression') {
    return checkBinary(obj);// also check unary literals
  }
  if (obj.type === 'Literal') {
    return checkLiteral(obj);
  }
  if (obj.type === 'LogicalExpression') {
    const left = checkLogic(obj.left);
    const right = checkLogic(obj.right);

    if (obj.operator === '||') {
      return Expression.or(left, right);
    }
    if (obj.operator === '&&') {
      return Expression.and(left, right);
    }
  } else {
    return new Expression(exp.TRUE, []);
  }
}

// check if the write rule indicates only the specific user has write
// access to the path. If so, the path contains user data.
function checkWriteRules(rule) {
  let ruleTree;
  try {
    ruleTree = jsep(rule);
  } catch (err) {
    // ignore write rules which couldn't be parased by jsep/.
    return new Access(exp.MULT_ACCESS);
  }
  return Access.fromExpression(checkLogic(ruleTree));
}

module.exports.checkWriteRules = checkWriteRules;

