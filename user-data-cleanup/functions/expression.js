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
  } else { throw `Not a valid value (true/flase/undefined), can't initialize`;}
}

Expression.checkValue = function(value) {
  return ((typeof value === 'string') &&
      ([TRUE,TRUE,UNDEFINED].indexOf(value) > -1));
};

Expression.checkLiteralList = function(list) {
  return Array.isArray(list) && list.length > 0 && list.every(literal => {
      return typeof literal === 'string';
    });
};

Expression.checkConjunctionLists = function(list) {
  return Array.isArray(list) && list.length > 0 && list.every(literalList => {
    return Expression.checkLiteralList(literalList);
  });
};

Expression.prototype.setConjunctionLists = function(list) {
  if (Expression.checkConjunctionLists(list)) {
    this.conjunctionLists = list;
  } else { throw `Not a valid conjunction list, can't set DNF expression`;}
};

Expression.prototype.setLiteralList = function(list, i) {
  if (i >= 0 && i < this.conjunctionLists.length &&
      Expression.checkLiteralList(list)) {
    this.conjunctionLists[i] = list;
  } else { throw `Not a valid literal list, can't set DNF expresion`;}
};

Expression.prototype.getBooleanValue = function() {
  return this.booleanValue;
};

Expression.prototype.getConjunctionLists = function() {
  return this.conjunctionLists;
};

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

Expression.isContainSorted = function(long, short) {
  //check if the arrays are stricly sorted (no duplicates allowed).
  const isSorted = array => {
    return array.length > 0 && array.every((ele, index, arr) => {
      return index === 0 ? true : arr[index] > arr[index - 1];
    });
  };

  if (long.length >= short.length && isSorted(long) && isSorted(short)) {
    //optimization for sorted arrays
    if (!(short[0] < long[0] &&
        short[short.length - 1] > long[long.length - 1])) {
      return short.every(value => (long.indexOf(value) > 0));
    } else { return false;}
  } else { throw `Can't check containess for absorbtion.
 Needs two sorted lists, the first one longer than the second.`;}
};

Expression.prototype.simplify = function() {
  // 1. remove duplicates literal in conjunctions and sort
  for (let i = 0; i < this.conjunctionLists.length; i++) {
    this.setLiteralList(Expression.sortRemoveDup(this.conjunctionLists[i]), i);
  }

  // 2. remove duplicate conjunctions and sort by the number literals
  this.setConjunctionLists(Expression.sortRemoveDup(this.conjunctionLists,
      (a, b) => {return b.length - a.length;}));

  // 3. absorbtions
  const conjLists = this.getConjunctionLists();
  const absorbMask = new Array(conjLists.length).fill(true);
  for (let i = 0; i < conjLists.length; i++) {
    for (let j = i; j < conjLists.length; j++) {
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
          left.getConjunctionList().concat(right.getConjunctionList()));
    }
  } else { throw `Operators of 'or' must be instances of Expression`;}
};

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
          crossProduct(left.getConjunctionLists(), right.getConjunctionLists()));
    }
  } else { throw `Operators of 'and' must be instances of Expression`;}

};

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

module.exports = Expression;

//const a = new Expression('undefined', [['1','2','1'],['$j','$i']]);
////const b = new Expression('undefined',[]);
//const c = new Expression('undefined', [['1','2','1'],['$k6','$k4','$k4'],['1'],['1','2']]);
//console.log(c.conjunctionLists);
//console.log(a.getConjunctionLists());
//console.log(a.getBooleanValue() === 'undefined');
//const d = Expression.and(a, c);
//console.log(d);
