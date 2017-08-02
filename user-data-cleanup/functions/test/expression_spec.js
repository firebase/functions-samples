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
// unit tests for the Expression class

const common = require('./common');
const exp = require('../expression');
const Expression = exp.Expression;
const expect = common.expect;

const expectExp = (exp, list) => {
  expect(exp.getConjunctionLists()).to.deep.equal(list);
};

const expectBoolean = (exp, value) => {
  expect(exp.getBooleanValue()).to.equal(value);
};

const expectCond = (exp, cond) => {
  expect(exp.getCondition()).to.equal(cond);
};

const newExpfromList = (list) => {
  return new Expression(exp.UNDEFINED, list);
};

describe('Expressions', () => {
  it('should not create expression with illegal parameters', () => {
    const new1 = () => new Expression(exp.UNDEFINED, []);
    const new2 = () => new Expression(exp.UNDEFINED, [[[]]]);
    const new3 = () => new Expression(exp.UNDEFINED, [1,2,3]);
    const new4 = () => new Expression(exp.UNDEFINED, [[1,2,3]]);
    const new5 = () => new Expression(exp.UNDEFINED, [[1,2,3], []]);
    const new6 = () => new Expression(exp.UNDEFINED, [[]]);
    const new7 = () => new Expression(true, [[1,2,3]]);
    const new8 = () => new Expression(exp.TRUE, [], 1);

    expect(new1).to.throw(`Not a valid conjunction list, can't initialize`);
    expect(new2).to.throw(`Not a valid conjunction list, can't initialize`);
    expect(new3).to.throw(`Not a valid conjunction list, can't initialize`);
    expect(new4).to.throw(`Not a valid conjunction list, can't initialize`);
    expect(new5).to.throw(`Not a valid conjunction list, can't initialize`);
    expect(new6).to.throw(`Not a valid conjunction list, can't initialize`);
    expect(new7).to.throw(`Not a valid boolean value, can't initialize`);
    expect(new8).to.throw(`Condition needs to be a string or undefined`);

  });

  it('should have empty conjunctionLists with fixed boolean values', () => {
    const exp1 = new Expression(exp.TRUE, [[]]);
    const exp2 = new Expression(exp.TRUE, [[1,2,3], ['a','b','c']]);
    const exp3 = new Expression(exp.FALSE, [[]]);
    const exp4 = new Expression(exp.FALSE, [[1,2,3], ['a','b','c']]);

    expectExp(exp1, []);
    expectExp(exp2, []);
    expectExp(exp3, []);
    expectExp(exp4, []);
  });

  it('should create exp with correct condition', () => {
    const expF = new Expression(exp.FALSE, [], 'some condition');
    const expT = new Expression(exp.TRUE, [], 'some condition');
    const expU = new Expression(exp.UNDEFINED,
        [['a']], 'some condition');

    expectCond(expF, undefined);
    expectCond(expT, 'some condition');
    expectCond(expU, 'some condition');
  });

  it('should be properly simplified: literals ', () => {
    const exp1 = newExpfromList([['$c', '$b', '$a']]);
    const exp2 = newExpfromList([['$a', '$a', '$a']]);
    const exp3 = newExpfromList([['$a', '$b', '$c']]);
    const exp4 = newExpfromList([['$a']]);
    const exp5 = newExpfromList([['$a', 'a']]);

    expectExp(exp1, [['$a', '$b', '$c']]);
    expectExp(exp2, [['$a']]);
    expectExp(exp3, [['$a', '$b', '$c']]);
    expectExp(exp4, [['$a']]);
    expectExp(exp5, [['$a', 'a']]);

  });

  it('should be properly simplified: clauses', () => {
    const exp1 = newExpfromList([['$c', '$b', '$a'], ['$c', '$b', '$a'],
        ['$c', '$a', '$b']]);
    const exp2 = newExpfromList([['$a', '$a', '$a'], ['$a']]);
    const exp3 = newExpfromList([['$a', '$b', '$c'], ['$d', '$e'],
        ['$e', '$d']]);
    const exp4 = newExpfromList([['$a']]);

    expectExp(exp1, [['$a', '$b', '$c']]);
    expectExp(exp2, [['$a']]);
    expectExp(exp3, [['$a', '$b', '$c'],['$d', '$e']]);
    expectExp(exp4, [['$a']]);
  });

  it('should be properly simplified: absorption', () => {
    const exp1 = newExpfromList([['$c', '$b', '$a'], ['$b', '$a'],['$c']]);
    const exp2 = newExpfromList([['$a', '$b', '$c'], ['$a', '$b'], ['$a']]);
    const exp3 = newExpfromList([['$a', '$b'], ['$c', '$b'], ['$c', '$a']]);

    expectExp(exp1, [['$a', '$b'], ['$c']]);
    expectExp(exp2, [['$a']]);
    expectExp(exp3, [['$a', '$b'], ['$b', '$c'], ['$a', '$c']]);
  });

  describe('should do correct operations', () => {
    const expTrue = new Expression(exp.TRUE,[[]]);
    const expFalse = new Expression(exp.FALSE,[[]]);
    const exp1 = newExpfromList([['$a', '$b'], ['$c', '$b'], ['$c', '$a']]);
    const exp2 = newExpfromList([['$a']]);
    const exp3 = newExpfromList([['$a', '$b']]);
    const expCond1 = new Expression(exp.TRUE, [], '$k1 < 1000');
    const expCond2 = new Expression(exp.UNDEFINED, [['$a']], '$k1 < 1000');
    const expCond3 = new Expression(exp.UNDEFINED, [['$b'],['$c']],
        '${/user/$uid}.exists()');

    it('should do correct AND operations', () => {
      // cases with true and false in AND
      expectBoolean(Expression.and(expTrue, expFalse), exp.FALSE);
      expectBoolean(Expression.and(exp1, expFalse), exp.FALSE);
      expectBoolean(Expression.and(expTrue, exp1), exp.UNDEFINED);
      expectExp(Expression.and(expTrue, exp1), exp1.getConjunctionLists());
      // AND of expressions without fixed boolean values.
      expectExp(Expression.and(exp1, exp2), [['$a', '$b'], ['$a', '$c']]);
      expectExp(Expression.and(exp2, exp1), [['$a', '$b'], ['$a', '$c']]);
      expectExp(Expression.and(exp1, exp3), [['$a', '$b']]);
      expectExp(Expression.and(exp3, exp1), [['$a', '$b']]);
      expectExp(Expression.and(exp2, exp3), [['$a', '$b']]);
      // conditions after AND operations
      expectCond(Expression.and(expCond1, exp1), '$k1 < 1000');
      expectCond(Expression.and(expCond1, expCond2),
          '$k1 < 1000 && $k1 < 1000');
      expectCond(Expression.and(expCond2, expCond3),
          '$k1 < 1000 && ${/user/$uid}.exists()');
      expectCond(Expression.and(expFalse, expCond2), undefined);
    });

    it('should do correct OR operations', () => {
      // cases with true and false in OR
      expectBoolean(Expression.or(expTrue, expFalse), exp.TRUE);
      expectBoolean(Expression.or(expTrue, exp1), exp.TRUE);
      expectBoolean(Expression.or(expFalse, exp1), exp.UNDEFINED);
      expectExp(Expression.or(exp1, expFalse), exp1.getConjunctionLists());
      // AND of expressions without fixed boolean values.
      expectExp(Expression.or(exp1, exp2), [['$b', '$c'], ['$a']]);
      expectExp(Expression.or(exp2, exp1), [['$b', '$c'], ['$a']]);
      expectExp(Expression.or(exp1, exp3),
          [['$a', '$b'], ['$b', '$c'], ['$a', '$c']]);
      expectExp(Expression.or(exp3, exp1),
          [['$a', '$b'], ['$b', '$c'], ['$a', '$c']]);
      expectExp(Expression.or(exp2, exp3), [['$a']]);
    });
  });
});

