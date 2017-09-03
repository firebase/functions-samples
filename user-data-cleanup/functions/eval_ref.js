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

// Evaluates data references
// Exports evalRef()
const common = require('./common');

/**
 * Evaluates data references
 *
 * @param {object} callExp input CallExpression
 * @param {array} path current path
 * @return {string} which represents the value of the call expression
 * or undefined if expression contains newData.
 */
const evalRef = (callExp, path) => {
  if (JSON.stringify(callExp).split(/\W/).includes('newData')) {
    // return undefined for newData, any logic expression on this should be true
    return null;
  }

  const refValue = evalCallExp(callExp, path);
  if (refValue.length !== 1) {
    throw new Error('Not a valid value. Did you forget .val() at the end?');
  }
  return refValue[0];
};

/**
 * Evaluates CallExpression
 *
 * @param {object}  obj input CallExpression
 * @param {array} path current path
 * @return {array} list holding variables in the data reference
 */
const evalCallExp = (obj, path) => {
    const arg = obj.arguments;

    // Evaluate the callee
    const result = evalMember(obj.callee, path);
    // Apply the arguments
    if (arg.length === 0) {
      // if no argument
      if (result[result.length - 1] === '#CHILD') {
        throw new Error('Needs a argument for child ()');
      }
      return result;
    }
    // Evaluate the argument (only one argurment allowed)
    const argVal = evalArg(arg['0'], path);

    if (result[result.length - 1] !== '#CHILD') {
      throw new Error('Only supports argument for child()');
    }
    // Replace the place holder with actuall argument
    result[result.length - 1] = argVal;
    return result;
  };


/**
 * Evaluates MemberExpression
 * The property is the function to call: child(), parent(), val(), exists()
 * The object is the entity which calls the function
 *
 * @param {object} obj input MemberExpression
 * @param {array} path current path
 * @return {array} holding variables in the data reference
 */
const evalMember = (obj, path) => {
  let result = [];
  switch (obj.object.type) {
    case 'Identifier':
      result = result.concat(evalIdentifier(obj.object, path));
    break;

    case 'CallExpression':
      result = evalCallExp(obj.object, path);
    break;

    default:
      throw new Error('Invalid member object for data reference ' +
                      obj.object.type);
  }

  if (obj.property.type !== 'Identifier') {
    throw new Error('Property should be Identifiers');
  }

  // dealing with functions
  switch (obj.property.name) {
    case 'child':
      result.push('#CHILD'); //Child place holder
      return result;

    case 'parent':
      if (result.length <= 2) { // Index 0 is always 'rules'
        throw new Error('No parent avaliable');
      }
      result.splice(result.length - 1, 1);
      return result;

    case 'val':
      return ['val(' + result.join(',') + ')'];

    case 'exists':
      return ['exists(' + result.join(',') + ')'];

    default:
      throw new Error(`Only support reference child(), parent(), val() \
and exists() now, ${obj.property.name} found`);
  }
};

/**
 * Evaluates Identifier, replace root/data with value.
 *
 * @param {object} id input identifier (jsep parse tree)
 * @param {array} path current path
 * @return {string or list of string} representing identifier
 */
const evalIdentifier = (id, path) => {
    if (id.type !== 'Identifier') {
      throw new Error('evalIdentifier() needs Identifiers as input');
    }
    switch (id.name) {
      case 'root':
        return 'rules';

      case 'data':
        return path.slice();

      case 'newData':
        throw new Error('newData not supported');
    }
    return id.name;
  };

/**
 * Helper function, checks if a MemerberExpression is auth.uid
 *
 * @param {object} obj input MemberExpression
 * @return {Boolean}
 */
const checkAuth = obj =>
    obj.type === 'MemberExpression' && obj.object.name === 'auth' &&
      obj.property.name === 'uid';


/**
 * Evaluates argument of functions
 *
 * @param {object} arg input argument (jsep parse tree)
 * @param {array} path current path
 * @return {string} representation of argument value
 */
const evalArg = (arg, path) => {
  switch (arg.type) {
    case 'Identifier':
      return evalIdentifier(arg, path);

    case 'Literal':
      return arg.value;

    case 'MemberExpression':
      if (checkAuth(arg)) {
        return common.WIPEOUT_UID;
      }
    throw new Error('member reference not supported, except auth.uid');

    case 'CallExpression': {
      const result = evalCallExp(arg, path);

      if (result.length !== 1) {
        throw new Error('Invalid argument' + result.toString());
      }
      return result[0];
    }
    default:
      throw new Error('Unsupported argument type: ' + arg.type);
  }
};

/** Evaluates data references */
module.exports.evalRef = evalRef;

/** Helper function, checks if a MemerberExpression is auth.uid */
module.exports.checkAuth = checkAuth;
