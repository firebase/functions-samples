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

  it('should do preprocessing correctly', () => {
    expect(wipeout.preProcess([{path: '/chat/#WIPEOUT_UID'}], fakeUserId))
        .to.deep.equal([{path: `/chat/${fakeUserId}`}]);

  });

  it('should evaluate conditions correctly', () => {
    expect(wipeout.checkCondition(
        `0 > 1`, fakeUserId)).to.eventually.equal(false);
    expect(wipeout.checkCondition(
        `1 > 0 && 3 > 1`, fakeUserId)).to.eventually.equal(true);
    expect(wipeout.checkCondition(
        `#WIPEOUT_UID != 'U12345'`, fakeUserId)).to.eventually.equal(true);

    const snapshot1 = sinon.stub(refStub, 'once');
    snapshot1.withArgs('value')
        .resolves({'exists': () => true, 'val': () => 'TEST'});
    refStub.withArgs(`/users2/${fakeUserId}/test`).returns({once: snapshot1});
    expect(wipeout.checkCondition(
        `exists(rules,users2,#WIPEOUT_UID,test)`,
         fakeUserId)).to.eventually.equal(true);
    expect(wipeout.checkCondition(
        `val(rules,users2,#WIPEOUT_UID,test) == 'TEST'`,
        fakeUserId)).to.eventually.equal(true);

    const snapshot2 = sinon.stub(refStub, 'once');
    snapshot2.withArgs('value')
        .resolves({'exists': () => true, 'val': () => fakeUserId});
    refStub.withArgs(`/users2/${fakeUserId}/creator`)
        .returns({once: snapshot2});
    expect(wipeout.checkCondition(
        `val(rules,users2,#WIPEOUT_UID,creator) == #WIPEOUT_UID`,
      fakeUserId)).to.eventually.equal(true);
    expect(wipeout.checkCondition(
        `val(rules,users2,#WIPEOUT_UID,creator) == #WIPEOUT_UID && #WIPEOUT_UID != 'U12345'`,
        fakeUserId)).to.eventually.equal(true);
  });

  it('should filter out false conditions', () => {
    const config = [
    {path: `/users/${fakeUserId}`, condition: 'true'},
    {path: `/users2/${fakeUserId}`, condition: 'false'},
    ];
    expect(wipeout.filterCondition(config, fakeUserId))
        .to.eventually.deep.equal([{'path': `/users/${fakeUserId}`}]);
  });

  it('should evaluate authVar correctly', () => {
    const childStub = sinon.stub();
    const queryStub = sinon.stub();
    const snapshot = sinon.stub();

    snapshot.withArgs('value')
        .resolves({
          'exists' : () => true,
          'val': () => {return {'room1': 'uid', 'room2': 'uid'};}
        });
    queryStub.withArgs(fakeUserId).returns({once: snapshot});
    childStub.withArgs('creator').returns({equalTo: queryStub});
    refStub.withArgs(`chat`).returns({orderByChild: childStub});

    expect(wipeout.evalSingleAuthVar({
      path: '/chat/$room',
      authVar: ['val(rules,chat,$room,creator)'],
      condition: 'foo'
    }, fakeUserId)).to.eventually.deep
    .equal([
      {path: '/chat/room1', condition: 'foo'},
      {path: '/chat/room2', condition: 'foo'}
    ]);

    expect(wipeout.evalSingleAuthVar({
      path: '/chat/$foo',
      authVar: ['val(rules,chat,$room,creator)'],
      condition: 'foo'
    }, fakeUserId)).to.eventually.deep
    .equal([]);
  });

  it('should evaluate authVar list correctly', () => {
    expect(wipeout.evalAuthVars([
      {
        path: '/chat/$room',
        authVar: ['val(rules,chat,$room,creator)'],
        condition: 'foo',
        except: '/chat/$room/members'
      },
      {path: '/chat/room3'}
    ], fakeUserId)).to.eventually.deep
    .equal([
      {path: '/chat/room3'},
      {path: '/chat/room1', condition: 'foo', except: '/chat/$room/members'},
      {path: '/chat/room2', condition: 'foo', except: '/chat/$room/members'}
    ]);
  });

  it('should evaluate exceptions correctly', () => {
    const snapshot = sinon.stub();
    snapshot.withArgs('value')
        .resolves({
          forEach: [].forEach
              .bind([{key: 'name'}, {key: 'creator'}, {key: 'members'}]),
           exists: () => true });

    refStub.withArgs(`chat/room`).returns({once: snapshot});

    expect(wipeout.evalSingleExcept({
      path: '/chat/room/',
      except: '/chat/room/members'
    })).to.eventually.deep
    .equal([
      {path: '/chat/room/name'},
      {path: '/chat/room/creator'},
      ]);

    expect(wipeout.evalSingleExcept({
      path: '/chat/room/',
      except: '/chat/room/foo'
    })).to.eventually.deep
    .equal([{path: '/chat/room/'}]);
  });

  it('should evaluate exception list correctly', () => {
    expect(wipeout.evalExcepts([
      {
        path: '/chat/room',
        except: 'chat/room/members'
      },
      {path: '/chat/room3'}
    ])).to.eventually.deep
    .equal([
      {path: '/chat/room3'},
      {path: '/chat/room/name'},
      {path: '/chat/room/creator'},
    ]);
  });

  it('should remove trailing free variables', () => {
    expect(wipeout.removeFreeVars([
        {path: '/chat/$room/'},
        {path: '/chat/$room/$member'},
        {path: '/chat/#WIPEOUT_UID/$room/'},
        {path: '/chat/$room/foo'},
        {path: '/$foo'}
      ])).to.deep.equal([
        {path: '/chat'},
        {path: '/chat'},
        {path: '/chat/#WIPEOUT_UID'}
      ]);
  });

  it('should delete data in deletePaths', () => {
    const removeParam = `/users/${fakeUserId}`;
    const removeParam2 = `/usersData/${fakeUserId}`;
    const removeStub = sinon.stub();
    refStub.withArgs(removeParam).returns({remove: removeStub});
    refStub.withArgs(removeParam2).returns({remove: removeStub});
    removeStub.resolves('Removed');

    expect(wipeout.deleteUser(deletePaths))
        .to.eventually.deep.equal(
        [
          {'path': removeParam},
          {'path': removeParam2}
        ]);
  });

  it('should write log into logging path', () => {
    const logParam = `/wipeout/history/${fakeUserId}`;
    const setStub = sinon.stub();
    refStub.withArgs(logParam).returns({set: setStub});
    setStub.resolves('Log added');

    expect(wipeout.writeLog(fakeUser))
        .to.eventually.equal('Log added');
  });
});
