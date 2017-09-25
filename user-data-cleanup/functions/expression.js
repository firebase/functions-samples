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

const TRUE = 'true';
const FALSE = 'false';
const UNDEFINED = 'undefined';

const NO_ACCESS = 0;
const SINGLE_ACCESS = 1;
const MULT_ACCESS = 2;

/** Create an Expresson object.
 * @param {string} value input string, should be TRUE/FALSE/UNDEFINED
 * @param {array} list conjunction list, should be list of literal lists
 * @param {string} condition the condition
 */
function Expression(value, list, condition = null) {
  if (!checkValue(value)) {
    throw new Error('Not a valid boolean value, can\'t initialize.');
  }
  this.booleanValue = value;
  if (typeof condition !== 'string' && condition !== null) {
    throw new Error('Condition needs to be a string or null');
  }
  if (value === FALSE) {
    // An expression with FALSE booleanValue should not have conditions
    condition = null;
  }
  this.condition = condition;
  if (value !== UNDEFINED) {
    this.conjunctionLists = [];
    return;
  }
  if (!checkConjunctionLists(list)) {
    throw new Error('Not a valid conjunction list, can\'t initialize');
  }
  this.conjunctionLists = list;
  this.simplify();
}

/**
 * Helper function, validity checking for booleanValue.
 *
 * @param {string} value input string, should be TRUE/FALSE/UNDEFINED
 * @return {Boolean}
 */
const checkValue = (value) =>
    (typeof value === 'string') && ([TRUE, FALSE, UNDEFINED].includes(value));

/**
 * Helper function, validity checking for Literal lists (conjunction clause).
 *
 * @param {array} list literal list, should be list of strings/literal
 * @return {Boolean}
 */
const checkLiteralList = (list) =>
      Array.isArray(list) && list.length > 0 && list.every(
        (literal) => typeof literal === 'string'
      );

/**
 * Helper function, validity checking for conjunction lists.
 *
 * @param {array} list conjunction list, should be list of literal lists
 * @return {Boolean}
 */
const checkConjunctionLists = (list) =>
      Array.isArray(list) && list.length > 0 && list.every(
        (literalList) => checkLiteralList(literalList)
      );

/**
 * Setter of conjunction lists.
 *
 * @param {array} list conjunction list, should be list of literal lists
 */
Expression.prototype.setConjunctionLists = function(list) {
  if (!checkConjunctionLists(list)) {
    throw new Error('not a valid conjunction list, can\'t set DNF expression');
  }
  this.conjunctionLists = list;
};

/**
 * Setter of literal list.
 *
 * @param {array} list literal list, should be list literal
 * @param {integer} i index to set
 */
Expression.prototype.setLiteralList = function(list, i) {
  if (i < 0 || i >= this.conjunctionLists.length ||
      !checkLiteralList(list)) {
    throw new Error('Inalid literal list or index, can\'t set DNF expresion');
  }
  this.conjunctionLists[i] = list;
};

/**
 * Getter of booleanValue
 * @return {string}
 */
Expression.prototype.getBooleanValue = function() {
  return this.booleanValue;
};

/**
 * Getter of conjunction list
 * @return {array}
 */
Expression.prototype.getConjunctionLists = function() {
  return this.conjunctionLists;
};

/**
 * Getter of condition, could be null if no condition
 * @return {string}
 */
Expression.prototype.getCondition = function() {
  return this.condition;
};

/**
 * Get access access number of a expression object
 * @return {integer}
 */
Expression.prototype.getAccessNumber = function() {
  if (this.booleanValue === FALSE) {
    return NO_ACCESS;
  }
  if (this.booleanValue === TRUE) {
    return MULT_ACCESS;
  }
  return this.getConjunctionLists().length === 1 ? SINGLE_ACCESS : MULT_ACCESS;
};

/**
 * Helper function which sort an array according to compare function sortBy,
 * and then remove any duplications based on stringify results.

 * @param {array} array to sort
 * @param {function} sortBy function indicating sorting principle
 * @return {Array}
 */
const sortRemoveDup = (array, sortBy) => {
  const exist = {};
  const result = array.filter((element) => {
    const strConjunction = JSON.stringify(element);
    if (exist.hasOwnProperty(strConjunction)) {
      return false;
    }
    exist[strConjunction] = true;
    return true;
  });
  result.sort(sortBy);
  return result;
};

/**
 * Helper function which checks if an array is a superset of the other.
 * Both arrays should be sorted, and the first array should be longer.

 * @param {array} long sorted array, candidate superset
 * @param {array} short sorted array, candidate subset
 * @return {Boolean}
 */
const isContainSorted = (long, short) => {
  // check if the arrays are stricly sorted (no duplicates allowed).
  const isSorted = (array) =>
      array.length > 0 && array.every((ele, index, arr) =>
          index === 0 ? true : arr[index] > arr[index - 1]);

  if (!(long.length >= short.length && isSorted(long) && isSorted(short))) {
    throw new Error(
        'Can\'t check containess for absorbtion. ' +
          'Needs two sorted lists, the first one longer than the second.');
  }
  if (short[0] < long[0] ||
      short[short.length - 1] > long[long.length - 1]) {
    // early termination optimization for sorted arrays
    return false;
  }
  return short.every((value) => long.includes(value));
};

/**
 * convert a expression in DNF to simplified form.
 */
Expression.prototype.simplify = function() {
  // 1. remove duplicates literal in conjunctions and sort
  for (let i = 0; i < this.conjunctionLists.length; i++) {
    this.setLiteralList(sortRemoveDup(this.conjunctionLists[i]), i);
  }

  // 2. remove duplicate conjunctions and sort by the number literals
  this.setConjunctionLists(sortRemoveDup(this.conjunctionLists,
      (a, b) => b.length - a.length));

  // 3. absorptions. A |(A & B) = A
  const conjLists = this.getConjunctionLists();
  const absorbMask = new Array(conjLists.length).fill(true);
  for (let i = 0; i < conjLists.length; i++) {
    for (let j = i + 1; j < conjLists.length; j++) {
      if (isContainSorted(conjLists[i], conjLists[j])) {
        absorbMask[i] = false;
        break;
      }
    }
  }
  this.setConjunctionLists(
    conjLists.filter((element, index) => absorbMask[index])
  );
};

const condOperation = (left, right, op) => {
  if (op !== '||' && op !== '&&') {
    throw new Error(`Invalid operation ${op} for conditions`);
  }

  if (left === null && right === null) {
    return null;
  }
  if (left === null) {
    return right;
  }
  if (right === null) {
    return left;
  }
  return `${left} ${op} ${right}`;
};

/**
 * OR of two expressions in DNF,
 * merge conjuntion lists of two expression and simplify
 *
 * @param {Expression} left left operand of OR
 * @param {Expression} right right operand of OR
 * @return {Expression}
 */
Expression.or = (left, right) => {
  if (!(left instanceof Expression && right instanceof Expression)) {
    throw new Error('Operators of "or" must be instances of Expression');
  }
  const newCond = condOperation(left.condition, right.condition, '||');
  if ((left.getBooleanValue() === TRUE) ||
      (right.getBooleanValue() === TRUE)) {
    return new Expression(TRUE, [], newCond);
  }
  if ((left.getBooleanValue() === FALSE)) {
    return right;
  }
  if (right.getBooleanValue() === FALSE) {
    return left;
  }
  return new Expression(UNDEFINED,
        left.getConjunctionLists().concat(right.getConjunctionLists()),
        newCond);
};

/**
 * AND of two expressions in DNF,cross product of the two conjunction lists.
 * Product of two clauses means the union of the their literals.
 *
 * @param {Expression} left left operand of AND
 * @param {Expression} right right operand of AND
 * @return {Expression}
 */
Expression.and = (left, right) => {
  const crossProduct = (l1, l2) => {
    if (!(checkConjunctionLists(l1) && checkConjunctionLists(l2))) {
      throw new Error('Only supports crossproduct of two conjunction lists');
    }
    const product = [];
    for (let i = 0; i < l1.length; i++) {
      for (let j = 0; j < l2.length; j++) {
        product.push(l1[i].concat(l2[j]));
      }
    }
    return product;
  };

  if (!(left instanceof Expression && right instanceof Expression)) {
    throw new Error('Operators of "and" must be instances of Expression');
  }
  const newCond = condOperation(left.condition, right.condition, '&&');

  if ((left.getBooleanValue() === FALSE) ||
      (right.getBooleanValue() === FALSE)) {
    return new Expression(FALSE, [], newCond);
  }
  if (left.getBooleanValue() === TRUE) {
    return new Expression(right.getBooleanValue(),
        right.getConjunctionLists(), newCond);
  }
  if (right.getBooleanValue() === TRUE) {
    return new Expression(left.getBooleanValue(),
        left.getConjunctionLists(), newCond);
  }
  return new Expression(UNDEFINED,
      crossProduct(left.getConjunctionLists(), right.getConjunctionLists()),
      newCond);
};

/** Misc ecports */
module.exports = {
  Expression: Expression,
  TRUE: TRUE,
  FALSE: FALSE,
  UNDEFINED: UNDEFINED,
  NO_ACCESS: NO_ACCESS,
  SINGLE_ACCESS: SINGLE_ACCESS,
  MULT_ACCESS: MULT_ACCESS,
  condOperation: condOperation,
};
