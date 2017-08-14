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
 * @param callExp input CallExpression
 * @param path current path
 * @return string which represents the value of the call expression
 * or undefined if expression contains newData.
 */
const evalRef = (callExp, path) => {
  if (JSON.stringify(callExp).split(/\W/).includes('newData')) {
    // return undefined for newData, any logic expression on this should be true
    return null;
  }

  const refValue = evalCallExp(callExp, path);
  if (refValue.length !== 1) {
    throw 'Not a valid referece value. Did you forget .val() at the end?';
  }
  return refValue[0];
};

/**
 * Evaluates CallExpression
 *
 * @param obj input CallExpression
 * @param path current path
 * @return list holding variables in the data reference
 */
const evalCallExp = (obj, path) => {
    const arg = obj.arguments;

    // Evaluate the callee
    const result = evalMember(obj.callee, path);
    // Apply the arguments
    if (arg.length === 0) {
      // if no argument
      if (result[result.length - 1] === '#CHILD') {
        throw 'Needs a argument for child ()';
      }
      return result;
    }
    // Evaluate the argument (only one argurment allowed)
    const argVal = evalArg(arg['0'], path);

    if (result[result.length - 1] !== '#CHILD') {
      throw 'Only supports argument for child()';
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
 * @param obj input MemberExpression
 * @param path current path
 * @return list holding variables in the data reference
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
      throw 'Invalid member object for data reference' + obj.object.type;
  }

  if (obj.property.type !== 'Identifier') {
    throw 'Property should be Identifiers';
  }

  // dealing with functions
  switch (obj.property.name) {
    case 'child':
      result.push('#CHILD'); //Child place holder
      return result;

    case 'parent':
      if (result.length <= 2) { // Index 0 is always 'rules'
        throw 'No parent avaliable';
      }
      result.splice(result.length - 1, 1);
      return result;

    case 'val':
      return ['val(' + result.join(',') + ')'];

    case 'exists':
      return ['exists(' + result.join(',') + ')'];

    default:
      throw `Only support reference child(), parent(), val() \
and exists() now, ${obj.property.name} found`;
  }
};

/**
 * Evaluates Identifier, replace root/data with value.
 *
 * @param id input identifier
 * @param path current path
 * @return string or list of string representing identifier
 */
const evalIdentifier = (id, path) => {
    if (id.type !== 'Identifier') {
      throw 'evalIdentifier() needs Identifiers as input';
    }
    switch (id.name) {
      case 'root':
        return 'rules';

      case 'data':
        const p = path.slice();
        return p;
      case 'newData':
        throw 'newData not supported';
    }
    return id.name;
  };

/**
 * Helper function, checks if a MemerberExpression is auth.uid
 *
 * @param obj input MemberExpression
 * @return true or false
 */
const checkAuth = obj =>
    obj.type === 'MemberExpression' && obj.object.name === 'auth' &&
      obj.property.name === 'uid';


/**
 * Evaluates argument of functions
 *
 * @param arg input argument
 * @param path current path
 * @return string representing argument value
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
      throw 'MemberExpression as argument not supported, except auth.uid';

    case 'CallExpression':
      const result = evalCallExp(arg, path);

      if (result.length !== 1) {
        throw 'Invalid argument' + result.toString();
      }
      return result[0];

    default:
      throw 'Unsupported argument type: ' + arg.type;
  }
};

module.exports.evalRef = evalRef;
module.exports.checkAuth = checkAuth;

