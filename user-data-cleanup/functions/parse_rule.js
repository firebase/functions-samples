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

//parsing write rules
const exp = require('./expression');
const Expression = exp.Expression;
const jsep = require('jsep');
const Access = require('./access');

// TODO(dzdz): consistent function representations

// check memeber expression of candidate auth.id
const checkMember = obj =>
    obj.type === 'MemberExpression' && obj.object.name === 'auth' &&
      obj.property.name === 'uid';

// get the DNF expression asscociated with auth.uid
const getExpression = obj => {
  if (obj.type === 'Literal') {
    return obj.raw === 'true' ?
        new Expression(exp.TRUE, []) : new Expression(exp.FALSE, []);
  }
  if (obj.type === 'Identifier') {
    return obj.name[0] === '$' ?
        new Expression(exp.UNDEFINED, [[obj.name]]) :
        new Expression(exp.FALSE, []);
  }
  return new Expression(exp.TRUE, []);// may contain data references.
};

// get candidate for binary expressions.
const getNonAuth = (obj, path) => {
  switch (obj.type) {
    case 'Literal':
      return obj.raw.toString();
    case 'Identifier':
      return obj.name.toString();
    case 'CallExpression':
      return parseCallExp(obj, path);
    default:
      throw `Type of BinaryExpression candidate ${obj.type} not supported`;
  }
};

// TODO(dzdz) : refactor function
function newCond(obj, path) {
  const condLeft = getNonAuth(obj.left, path);
  const condRight = getNonAuth(obj.right, path);
  if (typeof condLeft !== 'undefined' && typeof condRight !== 'undefined') {
    return `${condLeft} ${obj.operator} ${condRight}`;
  }
  return; // if either part contains newData, condition is true.

}

// check binary expressions for candidate auth.uid == ?
function checkBinary(obj, path) {
  if (obj.type !== 'BinaryExpression') {
    throw 'Expect Binary Expreesion';
  }

  if (obj.operator === '==' || obj.operator === '===') {
    if (checkMember(obj.left)) {
      return getExpression(obj.right);
    }
    if (checkMember(obj.right)) {
      return getExpression(obj.left);
    }
    //no auth invovled
    return new Expression(exp.TRUE, [], newCond(obj, path));
  }

  if (['==', '===', '<', '>', '<=', '>=', '!=', '!=='].includes(obj.operator)) {
    if (checkMember(obj.left) || checkMember(obj.right)) {
      return new Expression(exp.TRUE,[]);
    }
    return new Expression(exp.TRUE, [], newCond(obj, path));
  }
  return new Expression(exp.TRUE, []);
}

// check true or false literals
function checkLiteral(obj) {
  if (obj.type !== 'Literal') {
    throw 'Expect Literal';
  }

  if (obj.raw === 'true') {
    return new Expression(exp.TRUE, []);
  }
  if (obj.raw === 'false') {
    return new Expression(exp.FALSE, []);
  }
  throw 'Literals else than true or false are not supported';
}

// check (nested) logic expressions
function checkLogic(obj, path) {
  switch (obj.type) {
    // case 'CallExpression':
    // get back expression with condition.
    case 'BinaryExpression':
      return checkBinary(obj, path);
    case 'Literal':
      return checkLiteral(obj);
    case 'LogicalExpression':
      const left = checkLogic(obj.left, path);
      const right = checkLogic(obj.right, path);

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
}

// check if the write rule indicates only the specific user has write
// access to the path. If so, the path contains user data.
function checkWriteRules(rule, path) {
  let ruleTree;
  try {
    ruleTree = jsep(rule);
  } catch (err) {
    // ignore write rules which couldn't be parased by jsep/.
    return new Access(exp.MULT_ACCESS);
  }
  return Access.fromExpression(checkLogic(ruleTree, path));
}

const parseCallExp = (callExp, path) => {
  const re = /\s*[.()'"]\s*/;
  if (JSON.stringify(callExp).split(re).includes('newData')) {
    // return undefined for newData, any logic expression on this should be true
    return;
  }

  const refValue = parseRef(callExp, path);
  if (refValue.length !== 1) {
    throw 'Not a valid referece value. Did you forget .val() at the end?';
  }
  return refValue[0];
};

const parseRef = (obj, path) => {
  if (obj.type === 'CallExpression') {
    const arg = obj.arguments;

    // evaluate the callee
    const result = parseRef(obj.callee, path);

    // incorperate the arguments
    if (arg.length === 0) {
      // if no argument
      if (result[result.length - 1] === '#CHILD') {
        throw 'Needs a argument for child ()';
      }
      return result;
    }
    // evaluate the argument (only one argurment allowed)
    const argVal = evalArg(arg['0'], path);

    if (result[result.length - 1] !== '#CHILD') {
      throw 'Only supports argument for child()';
    }
    // replace the place holder with actuall argument
    result[result.length - 1] = argVal;
    return result;
  }

  // Member expresion where the object is the data path so far.
  // and the property is the function to call, can be child(), parent(), val(), exists()
  // among these, only child() hava one and only one argument
  if (obj.type === 'MemberExpression') {
    let result = [];

    switch (obj.object.type) {
      case 'Identifier':
        result = result.concat(evalIdentifier(obj.object, path));
        break;
      case 'CallExpression':
        result = parseRef(obj.object, path);
        break;
      default:
        throw 'Invalid member object for data reference' + obj.object.type;
    }

    if (obj.property.type !== 'Identifier') {
      throw 'Property should be Identifiers';
    }
    // dealing with different functions
    switch (obj.property.name) {
      case 'child':
        // push child holder to the end of the list
        result.push('#CHILD');
        return result;
      case 'parent':
        if (result.length <= 2) { // index 0 is always 'rules'
          throw 'No parent avaliable';
        }
        result.splice(result.length - 1, 1);
        return result;
      case 'val':
        return ['{' + result.join('/') + '}.val()'];

      case 'exists':
        return ['{' + result.join('/') + '}.exists()'];

      default:
        throw `Only support reference child(), parent(), \
val() and exists() now, ${obj.property.name} found`;
    }
  }
  throw 'Unsupported data references';
};

const evalIdentifier = (id, path) => {
    if (id.type !== 'Identifier') {
      throw 'evalIdentifier() needs Identifiers as input';
    }
    switch (id.name) {
      case 'root':
        return '';

      case 'data':
        const p = path.slice();
        p[0] = '';
        return p;

      case 'newData':
        throw 'newData not supported';
    }
    return id.name;
  };

// argument, could be a literal/auth.uid/other data references.
const evalArg = (arg, path) => {
  switch (arg.type) {
    case 'Identifier':
      return evalIdentifier(arg, path);

    case 'Literal':
      return arg.value;

    case 'MemberExpression':
      if (checkMember(arg)) {
        return '#WIPEOUT_UID';//TODO(dzdz) change place holder.
      }
      throw 'MemberExpression as argument not supported, except auth.uid';

    case 'CallExpression':
      const result = parseRef(arg, path);

      if (result.length !== 1) {
        throw 'Invalid argument' + result.toString();
      }
      return result[0];

    default:
      throw 'Unsupported argument type: ' + arg.type;
  }
};

module.exports.checkWriteRules = checkWriteRules;

if (process.env.NODE_ENV === 'TEST') {
  module.exports.parseCallExp = parseCallExp;
}
