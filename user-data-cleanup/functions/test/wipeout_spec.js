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

const common = require('./common.js');
const admin = common.admin;
const chai = common.chai;
const chaiAsPromised = common.chaiAsPromised;
const expect = common.expect;
const functions = common.functions;
const sinon = common.sinon;

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
      'functions': functions,
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
    const config = [{'path': '/users/#WIPEOUT_UID'}];

    expect(wipeout.buildPath(config, fakeUserId))
        .to.eventually.deep.equal([{'path': `/users/${fakeUserId}`}]);
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
