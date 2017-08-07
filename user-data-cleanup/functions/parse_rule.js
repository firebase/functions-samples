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

// Parse write rules to get back the Access object of the rule.
// Exports parseWriteRule()
const common = require('./common');
const exp = require('./expression');
const Expression = exp.Expression;
const jsep = require('jsep');
const Access = require('./access');
const refs = require('./eval_ref');


/**
 * Parse a write rule to get the access and condition
 *
 * @param write rule
 * @param path, list of strings staring with 'rules'
 * @return Access object of the write rule
 */
const parseWriteRule = (rule, path) => {
  let ruleTree;
  try {
    ruleTree = jsep(rule);
  } catch (err) {
    // Ignore write rules which couldn't be parased by jsep.
    return new Access(exp.MULT_ACCESS);
  }
  return Access.fromExpression(parseLogic(ruleTree, path));
};

/**
 * Recursively parse logic expressions to get
 * the expression object of a logic expression.
 *
 * @param
 * @param path, list of strings staring with 'rules'
 * @return Expression object representing operands in logic expressions
 */
const parseLogic = (obj, path) => {
  switch (obj.type) {
    case 'CallExpression':
      return new Expression(exp.TRUE, [], refs.evalRef(obj, path));

    case 'BinaryExpression':
      return parseBinary(obj, path);

    case 'Literal':
      if (obj.raw === 'true') {
        return new Expression(exp.TRUE, []);
      }
      if (obj.raw === 'false') {
        return new Expression(exp.FALSE, []);
      }
      throw 'Literals else than true or false are not supported';

    case 'LogicalExpression':
      const left = parseLogic(obj.left, path);
      const right = parseLogic(obj.right, path);

      if (obj.operator === '||') {
        return Expression.or(left, right);
      }
      if (obj.operator === '&&') {
        return Expression.and(left, right);
      }
      throw `Unsupported logic operation: ${obj.operator}`;

    default:
      return new Expression(exp.TRUE, []);
  }
};

/**
 * Parse BinaryExpression to get the expression object
 *
 *
 * @param obj BinaryExpression to parse
 * @param path, list of strings staring with 'rules'
 * @return expression object of the BinaryExpression.
 */
const parseBinary = (obj, path) => {
  if (obj.type !== 'BinaryExpression') {
    throw 'Expect Binary Expreesion';
  }
  // auth involved in BinaryExpression
  if (refs.checkAuth(obj.left)) {
    return getAuthExp(obj.right, obj.operator, path);
  }
  if (refs.checkAuth(obj.right)) {
    return getAuthExp(obj.left, obj.operator, path);
  }
  //no auth invovled
  let newCond;
  const condLeft = getCond(obj.left, path);
  const condRight = getCond(obj.right, path);
  if (typeof condLeft !== 'undefined' && typeof condRight !== 'undefined') {
    newCond = `${condLeft} ${obj.operator} ${condRight}`;
  } else {
    // if either part is undefined(contains newData), the condition is ignored.
    newCond = undefined;
  }
  return new Expression(exp.TRUE, [], newCond);
};


/**
 * If one of the operand in BinaryExpression is auth,
 * parse the other side to get the auth expression.
 *
 * @param obj operand besides auth in BinaryExpression
 * @param op operator of the BinaryExpression
 * @return auth expression
 */
const getAuthExp = (obj, op, path) => {
  if (op !== '==' && op !== '===') {
    return new Expression(exp.TRUE, []);
  }

  if (obj.type === 'Literal') {
    return obj.raw === 'true' ?
        new Expression(exp.TRUE, []) : new Expression(exp.FALSE, []);
  }
  if (obj.type === 'Identifier') {
    return obj.name[0] === '$' ?
        new Expression(exp.UNDEFINED, [[obj.name]]) :
        new Expression(exp.FALSE, []);
  }
  if (obj.type === 'CallExpression') {
    const dataRef = refs.evalRef(obj, path)
    return new Expression(exp.UNDEFINED, [[refs.evalRef(obj, path)]],
        `${common.WIPEOUT_UID} === ${dataRef}`);
  }
  return new Expression(exp.TRUE, []);// May contain data references.
};

/**
 * If No auth in the BinaryExpression, parse the operand to
 * get candidates for conditions.
 *
 * @param obj operand of BinaryExpression
 * @param path, list of strings staring with 'rules'
 * @return string representing value of the operand
 */
const getCond = (obj, path) => {
  switch (obj.type) {
    case 'Literal':
      return obj.raw.toString();
    case 'Identifier':
      return obj.name.toString();
    case 'CallExpression':
      return refs.evalRef(obj, path);

    default:
      throw `Type of BinaryExpression candidate ${obj.type} not supported`;
  }
};


module.exports.parseWriteRule = parseWriteRule;
