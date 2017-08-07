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

const testCommon = require('./test_common');
const admin = testCommon.admin;
const chai = testCommon.chai;
const chaiAsPromised = testCommon.chaiAsPromised;
const expect = testCommon.expect;
const functions = testCommon.functions;
const sinon = testCommon.sinon;

describe('Wipeout', () => {
  let wipeout, configStub, refStub, confirmStub;
  let adminInitStub, databaseStub;

  const fakeUserId = '8ZfiT8HeMTN9a4etjfCmahBqhK52';
  const fakeUser = {
    uid: fakeUserId
  };
  const deletePaths = [
      {'path': `/users/${fakeUserId}`},
      {'path': `/usersData/${fakeUserId}`}
    ];

  before(() => {
    chai.use(chaiAsPromised);

    // create database and configuration stubs
    adminInitStub = sinon.stub(admin, 'initializeApp');
    databaseStub = sinon.stub(admin, 'database');

    refStub = sinon.stub();
    databaseStub.returns({ref: refStub});
    configStub = sinon.stub(functions, 'config').returns({
      firebase: {
        databaseURL: 'https://fakedb.firebaseio.com'
      },
      wipeout: {
        path: '/users/#WIPEOUT_UID'
      }
    });
    confirmStub = sinon.stub();
    refStub.withArgs(`/wipeout/confirm`).returns({set: confirmStub});

    const WIPEOUT_CONFIG = {
      'admin': admin,
      'db': admin.database(),
      'serverValue': admin.database.ServerValue,
      'DB_URL': functions.config().firebase.databaseURL
    };

    wipeout = require('../wipeout');
    wipeout.initialize(WIPEOUT_CONFIG);

  });

  after(() => {
    configStub.restore();
    adminInitStub.restore();
  });

  it('should build correct path', () => {
    const config = [
    {path: '/users/#WIPEOUT_UID', condition: 'true'},
    {path: '/users/#WIPEOUT_UID', condition: 'false'},

    ];
    expect(wipeout.buildPath(config, fakeUserId))
        .to.eventually.deep.equal([{'path': `/users/${fakeUserId}`}]);
  });

  it('should evaluate conditions correctly', () => {
    expect(wipeout.checkCondition(
        `0 > 1`, fakeUserId)).to.eventually.equal(false);
    expect(wipeout.checkCondition(
        `1 > 0 && 3 > 1`, fakeUserId)).to.eventually.equal(true);
    expect(wipeout.checkCondition(
        `#WIPEOUT_UID != 'U12345'`, fakeUserId)).to.eventually.equal(true);

    const snapshot1 = sinon.stub(refStub,'once');
    snapshot1.withArgs('value')
        .resolves({'exists': () => true, 'val': () => 'TEST'});
    refStub.withArgs(`/users2/${fakeUserId}/test`).returns({once: snapshot1});
    expect(wipeout.checkCondition(
        `exists(rules,users2,#WIPEOUT_UID,test)`,
         fakeUserId)).to.eventually.equal(true);
    expect(wipeout.checkCondition(
        `val(rules,users2,#WIPEOUT_UID,test) == 'TEST'`,
        fakeUserId)).to.eventually.equal(true);
   
    const snapshot2 = sinon.stub(refStub,'once');
    snapshot2.withArgs('value')
        .resolves({'exists': () => true, 'val': () => fakeUserId});
    refStub.withArgs(`/users2/${fakeUserId}/creator`)
        .returns({once: snapshot2});
    expect(wipeout.checkCondition(
        `val(rules,users2,#WIPEOUT_UID,creator) == #WIPEOUT_UID`,
      fakeUserId)).to.eventually.equal(true);
    expect(wipeout.checkCondition(
        `val(rules,users2,#WIPEOUT_UID,creator) == #WIPEOUT_UID \
&& #WIPEOUT_UID != 'U12345'`,
        fakeUserId)).to.eventually.equal(true);
  });

  it('should delete data in deletePaths', () => {
    const removeParam = `/users/${fakeUserId}`;
    const removeParam2 = `/usersData/${fakeUserId}`;
    const removeStub = sinon.stub();
    refStub.withArgs(removeParam).returns({remove: removeStub});
    refStub.withArgs(removeParam2).returns({remove: removeStub});
    removeStub.resolves('Removed');

    return expect(wipeout.deleteUser(deletePaths))
        .to.eventually.deep.equal(['Removed','Removed']);
  });

  it('should write log into logging path', () => {
    const logParam = `/wipeout/history/${fakeUserId}`;
    const setStub = sinon.stub();
    refStub.withArgs(logParam).returns({set: setStub});
    setStub.resolves('Log added');

    return expect(wipeout.writeLog(fakeUser))
          .to.eventually.equal('Log added');
  });
});
