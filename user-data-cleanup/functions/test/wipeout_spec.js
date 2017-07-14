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

const admin = require('firebase-admin');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
const fs = require('fs');
const functions = require('firebase-functions');
const sinon = require('sinon');
chai.use(chaiAsPromised);

// test input data which will be shared accross test cases
const fakeUserId = '8ZfiT8HeMTN9a4etjfCmahBqhK52';

describe('Wipeout', () => {
  let wipeout, configStub, refStub;
  let adminInitStub, databaseStub, deletePaths;

  before(() => {
    // create database and configuration stubs
    adminInitStub = sinon.stub(admin, 'initializeApp');
    databaseStub = sinon.stub(admin, 'database');
    deletePaths = [
      {'path': `/users/${fakeUserId}`},
      {'path': `/usersData/${fakeUserId}`}
    ];
    refStub = sinon.stub();
    databaseStub.returns({ref: refStub});
    configStub = sinon.stub(functions, 'config').returns({
      firebase: {
        databaseURL: 'https://fakedb.firebaseio.com'
      },
      wipeout: {
        path: '/users/$WIPEOUT_UID'
      }
    });

    const WIPEOUT_CONFIG = {
      'admin': admin,
      'DB_URL': functions.config().firebase.databaseURL,
      'WIPEOUT_UID': '$WIPEOUT_UID',
      'WRITE_SIGN': '.write',
      'PATH_REGEX': /^\/?$|(^(?=\/))(\/(?=[^/\0])[^/\0]+)*\/?$/
    };
    
    wipeout = require('../wipeout');
    wipeout.initialize(WIPEOUT_CONFIG);
  });

  after(() => {
    configStub.restore();
    adminInitStub.restore();
  });

  describe('Delete User', () => {
    const fakeUser = {
      uid: fakeUserId
    };

    it('should build correct path', () => {
      const config = [{'path': '/users/$WIPEOUT_UID'}];

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
      const logParam = `/wipeout-history/${fakeUserId}`;
      const setStub = sinon.stub();
      refStub.withArgs(logParam).returns({set: setStub});
      setStub.resolves('Log added');

      return expect(wipeout.writeLog(fakeUser))
            .to.eventually.equal('Log added');
    });

    // This is unit test for the path extraction functionality.
    // Currently the deletion of complex path hasn't been implemented.
    it('should extract correct wipeout rules from RTBD rules ', () => {
      const DBRules = fs.readFileSync('test/DBRules.json', 'utf-8');
      const deletePaths = wipeout.extractFromDBRules(DBRules);
      const userPaths = [{path: '/users/$WIPEOUT_UID'},
          {path: '/instagramAccessToken/$WIPEOUT_UID'},
          {path: '/accounts/$WIPEOUT_UID/githubToken'},
          {path: '/accounts/$WIPEOUT_UID/profileNeedsUpdate'},
          {path: '/users-say-that/$WIPEOUT_UID/lang'},
          {path: '/stripe_customers/$WIPEOUT_UID/sources/$chargeId'},
          {path: '/stripe_customers/$WIPEOUT_UID/charges/$sourceId'},
          {path: '/users-say-that/$WIPEOUT_UID/scenes/$scene/nouns'},
          {path: '/users-say-that/$WIPEOUT_UID/scenes/$scene/in_progress'}];

      return expect(deletePaths).to.deep.equal(userPaths);
    });
  });
});

