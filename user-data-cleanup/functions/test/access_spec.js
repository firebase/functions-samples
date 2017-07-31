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
//unit tests for the Access class

const Access = require('../access');
const common = require('./common');
const exp = require('../expression');
const expect = common.expect;

const expectVar = (acc, list) => {
  expect(acc.getVariableList()).to.deep.equal(list);
};

const expectAccess = (acc, access) => {
  expect(acc.getAccessStatus()).to.equal(access);
};

describe('Access', () => {

  it('should only create object with illegal parameters', () => {
    const new1 = () => new Access(exp.SINGLE_ACCESS,[]);
    const new2 = () => new Access(exp.SINGLE_ACCESS,[[[]]]);
    const new3 = () => new Access(exp.SINGLE_ACCESS,[[1,2,3]]);
    const new4 = () => new Access(true,['1','2','3']);

    expect(new1).to.throw(`Not a valid list of variable for single access.`);
    expect(new2).to.throw(`Not a valid list of variable for single access.`);
    expect(new3).to.throw(`Not a valid list of variable for single access.`);
    expect(new4).to.throw(`Not a valid access status.`);
  });

  it('should have empty variableList with NO/MULT access', () => {
    const acc1 = new Access(exp.NO_ACCESS,[[]]);
    const acc2 = new Access(exp.NO_ACCESS,['a','b','c']);
    const acc3 = new Access(exp.MULT_ACCESS,[[]]);
    const acc4 = new Access(exp.MULT_ACCESS,[[1,2,3]]);

    expectVar(acc1, []);
    expectVar(acc2, []);
    expectVar(acc3, []);
    expectVar(acc4, []);
  });

  it('should create correct object from exp', () => {
    const expT = new exp.Expression(exp.TRUE,[]);
    const expF = new exp.Expression(exp.FALSE,[]);
    const expUS = new exp.Expression(exp.UNDEFINED,[['a','b']]);
    const expUM = new exp.Expression(exp.UNDEFINED,
        [['a','b'],['c']]);

    const accN = Access.fromExpression(expF, []);
    const accM = Access.fromExpression(expT, []);
    const accM2 = Access.fromExpression(expUM, []);
    const accS = Access.fromExpression(expUS, ['a','b','c','d']);

    expectAccess(accN, exp.NO_ACCESS);
    expectAccess(accM, exp.MULT_ACCESS);
    expectAccess(accM2, exp.MULT_ACCESS);
    expectAccess(accS, exp.SINGLE_ACCESS);
    expectVar(accS, expUS.getConjunctionLists()[0]);
    // throw error when the path is wrong.
    const wrongPath = () => Access.fromExpression(expUS, ['a']);
    expect(wrongPath).to.throw('Write rule is using unknown variable');

  });

  it('should create correct object from rule and ancestor object', () => {
    const single1 = new Access(exp.SINGLE_ACCESS,['a','b']);
    const single2 = new Access(exp.SINGLE_ACCESS,['a','c']);
    const single3 = new Access(exp.SINGLE_ACCESS,['a','b','c']);
    const mult = new Access(exp.MULT_ACCESS,[]);
    const no = new Access(exp.NO_ACCESS,[]);

    // ancestor has multiple access patterns
    expectAccess(Access.nodeAccess(mult, single1), exp.MULT_ACCESS);
    expectAccess(Access.nodeAccess(mult, no), exp.MULT_ACCESS);
    expectAccess(Access.nodeAccess(mult, mult), exp.MULT_ACCESS);
    // ancestor has no access pattern
    expectAccess(Access.nodeAccess(no, single1), exp.SINGLE_ACCESS);
    expectAccess(Access.nodeAccess(no, no), exp.NO_ACCESS);
    expectAccess(Access.nodeAccess(no, mult), exp.MULT_ACCESS);
    expectVar(Access.nodeAccess(no, single1), single1.getVariableList());
    // ancestor has single access pattern
    expectAccess(Access.nodeAccess(single1, single2), exp.MULT_ACCESS);
    expectAccess(Access.nodeAccess(single1, single3),
        exp.SINGLE_ACCESS);
    expectVar(Access.nodeAccess(single1, single3), single1.getVariableList());

    expectAccess(Access.nodeAccess(single1, no), exp.SINGLE_ACCESS);
    expectVar(Access.nodeAccess(single1, no), single1.getVariableList());

    expectAccess(Access.nodeAccess(single1, mult), exp.MULT_ACCESS);

  });

});
