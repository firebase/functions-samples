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

function Expression(value, list, simplify = true) {
  if (Expression.checkValue(value)) {
    this.booleanValue = value;
    if (value === UNDEFINED) {
      if (Expression.checkConjunctionLists(list)) {
        this.conjunctionLists = list;
        if (simplify) {this.simplify();}
      } else { throw `Not a valid conjunction list, can't initialize`;}
    } else { this.conjunctionLists = [];} // if value is true/false, expression is not needed.
  } else { throw `Not a valid boolean value, can't initialize`;}
}

// validity checking for booleanValue.
Expression.checkValue = function(value) {
  return ((typeof value === 'string') &&
      ([TRUE,FALSE,UNDEFINED].indexOf(value) > -1));
};

// validity checking for Literal lists (conjunction clause).
Expression.checkLiteralList = function(list) {
  return Array.isArray(list) && list.length > 0 && list.every(literal => {
      return typeof literal === 'string';
    });
};

// validity checking for conjunction lists.
Expression.checkConjunctionLists = function(list) {
  return Array.isArray(list) && list.length > 0 && list.every(literalList => {
    return Expression.checkLiteralList(literalList);
  });
};

// setter for conjunctionLists
Expression.prototype.setConjunctionLists = function(list) {
  if (Expression.checkConjunctionLists(list)) {
    this.conjunctionLists = list;
  } else { throw `Not a valid conjunction list, can't set DNF expression`;}
};

// setter for literalList
Expression.prototype.setLiteralList = function(list, i) {
  if (i >= 0 && i < this.conjunctionLists.length &&
      Expression.checkLiteralList(list)) {
    this.conjunctionLists[i] = list;
  } else { throw `Not a valid literal list, can't set DNF expresion`;}
};

// getter for BooleanValue
Expression.prototype.getBooleanValue = function() {
  return this.booleanValue;
};

// getter  for ConjunctionLists
Expression.prototype.getConjunctionLists = function() {
  return this.conjunctionLists;
};

// calculate the write access state of the rule.
Expression.prototype.getAccessNumber = function() {
  if (this.booleanValue === FALSE) {
    return NO_ACCESS;
  } else if (this.booleanValue === TRUE) {
    return MULT_ACCESS;
  } else {
    return this.getConjunctionLists().length === 1 ?
        SINGLE_ACCESS : MULT_ACCESS;
  }
};

// helper function which sort an array according to compare function sortBy,
// and then remove any duplications based on stringify results.
Expression.sortRemoveDup = function(array, sortBy) {
  const exist = {};
  array = array.filter(element => {
    const strConjunction = JSON.stringify(element);
    if (exist.hasOwnProperty(strConjunction)) {
      return false;
    } else {
      exist[strConjunction] = true;
      return true;
    }
  });
  array.sort(sortBy);
  return array;
};

// helper function which checks if long is a superset of short.
// requirments: 1. long and short are both sorted arries
// 2. the length of long is not smaller than short.
Expression.isContainSorted = function(long, short) {
  //check if the arrays are stricly sorted (no duplicates allowed).
  const isSorted = array => {
    return array.length > 0 && array.every((ele, index, arr) => {
      return index === 0 ? true : arr[index] > arr[index - 1];
    });
  };

  if (long.length >= short.length && isSorted(long) && isSorted(short)) {
    // early termination optimization for sorted arrays
    if (!(short[0] < long[0] &&
        short[short.length - 1] > long[long.length - 1])) {
      return short.every(value => (long.indexOf(value) > -1));
    } else { return false;}
  } else { throw `Can't check containess for absorbtion.
 Needs two sorted lists, the first one longer than the second.`;}
};

//convert a expression in DNF to simplified form.
Expression.prototype.simplify = function() {
  // 1. remove duplicates literal in conjunctions and sort
  for (let i = 0; i < this.conjunctionLists.length; i++) {
    this.setLiteralList(Expression.sortRemoveDup(this.conjunctionLists[i]), i);
  }

  // 2. remove duplicate conjunctions and sort by the number literals
  this.setConjunctionLists(Expression.sortRemoveDup(this.conjunctionLists,
      (a, b) => {return b.length - a.length;}));

  // 3. absorptions. A |(A & B) = A
  const conjLists = this.getConjunctionLists();
  const absorbMask = new Array(conjLists.length).fill(true);
  for (let i = 0; i < conjLists.length; i++) {
    for (let j = i + 1; j < conjLists.length; j++) {
      if (Expression.isContainSorted(conjLists[i], conjLists[j])) {
        absorbMask[i] = false;
        break;
      }
    }
  }
  this.setConjunctionLists(conjLists.filter((element, index) => {
    return absorbMask[index];
  }));
};

// OR of two expressions in DNF,
// merge conjuntion lists of two expression and simplify
Expression.or = function(left, right) {
  if (left instanceof Expression && right instanceof Expression) {

    if ((left.getBooleanValue() === TRUE) ||
        (right.getBooleanValue() === TRUE)) {
      return new Expression(TRUE,[]);
    } else if ((left.getBooleanValue() === FALSE)) {
      return right;
    } else if (right.getBooleanValue() === FALSE) {
      return left;
    } else {
      return new Expression(UNDEFINED,
          left.getConjunctionLists().concat(right.getConjunctionLists()));
    }
  } else { throw `Operators of 'or' must be instances of Expression`;}
};

// AND of two expressions in DNF, cross product of the two conjunction lists.
// Product of two clauses means the union of the their literals.
Expression.and = function(left, right) {

  const crossProduct = (l1, l2) => {
    if (Expression.checkConjunctionLists(l1) &&
        Expression.checkConjunctionLists(l2)) {
      const product = [];
      for (let i = 0; i < l1.length; i++) {
        for (let j = 0; j < l2.length; j++) {
          product.push(l1[i].concat(l2[j]));
        }
      }
      return product;
    } else { throw 'Only supports crossproduct of two conjunction lists';}
  };

  if (left instanceof Expression && right instanceof Expression) {

    if ((left.getBooleanValue() === FALSE) ||
        (right.getBooleanValue() === FALSE)) {
      return new Expression(FALSE,[]);
    } else if (left.getBooleanValue() === TRUE) {
      return right;
    } else if (right.getBooleanValue() === TRUE) {
      return left;
    } else {
      return new Expression(UNDEFINED,
          crossProduct(left.getConjunctionLists(),
              right.getConjunctionLists()));
    }
  } else { throw `Operators of 'and' must be instances of Expression`;}

};

module.exports = {
  Expression: Expression,
  TRUE: TRUE,
  FALSE: FALSE,
  UNDEFINED: UNDEFINED,
  NO_ACCESS: NO_ACCESS,
  SINGLE_ACCESS: SINGLE_ACCESS,
  MULT_ACCESS: MULT_ACCESS
};
