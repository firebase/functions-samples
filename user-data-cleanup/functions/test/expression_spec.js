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
const expression = require('../expression');
const Expression = expression.Expression;
const expect = common.expect;

const expectExp = (exp, list) => {
  expect(exp.getConjunctionLists()).to.deep.equal(list);
};

const expectBoolean = (exp, value) => {
  expect(exp.getBooleanValue()).to.equal(value);
};

const newExpfromList = (list) => {
  return new Expression(expression.UNDEFINED, list);
};

describe('Expressions', () => {
  it('should not create expression with illegal parameters', () => {
    const new1 = () => new Expression(expression.UNDEFINED, []);
    const new2 = () => new Expression(expression.UNDEFINED, [[[]]]);
    const new3 = () => new Expression(expression.UNDEFINED, [1,2,3]);
    const new4 = () => new Expression(expression.UNDEFINED, [[1,2,3]]);
    const new5 = () => new Expression(expression.UNDEFINED, [[1,2,3], []]);
    const new6 = () => new Expression(expression.UNDEFINED, [[]]);
    const new7 = () => new Expression(true, [[1,2,3]]);

    expect(new1).to.throw(`Not a valid conjunction list, can't initialize`);
    expect(new2).to.throw(`Not a valid conjunction list, can't initialize`);
    expect(new3).to.throw(`Not a valid conjunction list, can't initialize`);
    expect(new4).to.throw(`Not a valid conjunction list, can't initialize`);
    expect(new5).to.throw(`Not a valid conjunction list, can't initialize`);
    expect(new6).to.throw(`Not a valid conjunction list, can't initialize`);
    expect(new7).to.throw(`Not a valid boolean value, can't initialize`);
  });

  it('should have empty conjunctionLists with fixed boolean values', () => {
    const exp1 = new Expression(expression.TRUE, [[]]);
    const exp2 = new Expression(expression.TRUE, [[1,2,3], ['a','b','c']]);
    const exp3 = new Expression(expression.FALSE, [[]]);
    const exp4 = new Expression(expression.FALSE, [[1,2,3], ['a','b','c']]);

    expectExp(exp1, []);
    expectExp(exp2, []);
    expectExp(exp3, []);
    expectExp(exp4, []);
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

  it('should do correct AND operations', () => {
    const expTrue = new Expression(expression.TRUE,[[]]);
    const expFalse = new Expression(expression.FALSE,[[]]);
    const exp1 = newExpfromList([['$a', '$b'], ['$c', '$b'], ['$c', '$a']]);
    const exp2 = newExpfromList([['$a']]);
    const exp3 = newExpfromList([['$a', '$b']]);

    // cases with true and false in AND
    expectBoolean(Expression.and(expTrue, expFalse), expression.FALSE);
    expectBoolean(Expression.and(exp1, expFalse), expression.FALSE);
    expectBoolean(Expression.and(expTrue, exp1), expression.UNDEFINED);
    expectExp(Expression.and(expTrue, exp1), exp1.getConjunctionLists());
    // AND of expressions without fixed boolean values.
    expectExp(Expression.and(exp1, exp2), [['$a', '$b'], ['$a', '$c']]);
    expectExp(Expression.and(exp2, exp1), [['$a', '$b'], ['$a', '$c']]);
    expectExp(Expression.and(exp1, exp3), [['$a', '$b']]);
    expectExp(Expression.and(exp3, exp1), [['$a', '$b']]);
    expectExp(Expression.and(exp2, exp3), [['$a', '$b']]);
  });

  it('should do correct OR operations', () => {
    const expTrue = new Expression(expression.TRUE,[[]]);
    const expFalse = new Expression(expression.FALSE,[[]]);
    const exp1 = newExpfromList([['$a', '$b'], ['$c', '$b'], ['$c', '$a']]);
    const exp2 = newExpfromList([['$a']]);
    const exp3 = newExpfromList([['$a', '$b']]);

    // cases with true and false in OR
    expectBoolean(Expression.or(expTrue, expFalse), expression.TRUE);
    expectBoolean(Expression.or(expTrue, exp1), expression.TRUE);
    expectBoolean(Expression.or(expFalse, exp1), expression.UNDEFINED);
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

