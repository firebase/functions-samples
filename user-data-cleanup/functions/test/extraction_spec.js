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

// unit tests for automatically generated wipeout rules,
// from RTDB rules and storage rules.

const common = require('./common');
const expression = require('../expression');
const expect = common.expect;
const fs = require('fs');
const wipeout = require('../wipeout');

const expectAccess = (rule, path, access) => {
  expect(wipeout.checkWriteRules(path, rule).getAccessStatus())
      .to.equal(access);
};

const expectVars = (rule, path, vars) => {
  expect(wipeout.checkWriteRules(path, rule).getVariableList())
      .to.deep.equal(vars);
};

describe('Auto generation of rules', () => {

  it('should get correct access from write rules', () => {
    expectAccess('true', [], expression.MULT_ACCESS);
    expectAccess('false', [], expression.NO_ACCESS);
    expectAccess('auth.uid == $user', ['$user'], expression.SINGLE_ACCESS);
    expectAccess('auth.uid === $user', ['$user'], expression.SINGLE_ACCESS);
    expectAccess('$user === auth.uid', ['$user'], expression.SINGLE_ACCESS);
    expectAccess('$random_name === auth.uid', ['$user','$random_name'],
        expression.SINGLE_ACCESS);
    expectVars('$random_name === auth.uid', ['$user','$random_name'],
        ['$random_name']);
  });

  it('should deal with logic expressions correctly', () => {

  });

  it('should extract correct wipeout rules from RTBD rules ', () => {
    const DBRules = fs.readFileSync('test/DBRules.json', 'utf-8');
    const inferredDeletePaths = wipeout.extractFromDBRules(DBRules);
    const userPaths = [
        {except: '/admin'},
        {path: '/users/#WIPEOUT_UID'},
        {path: '/instagramAccessToken/#WIPEOUT_UID'},
        {path: '/users2/#WIPEOUT_UID'},
        {path: '/accounts/#WIPEOUT_UID/githubToken'},
        {path: '/accounts/#WIPEOUT_UID/profileNeedsUpdate'},
        {path: '/users-say-that/#WIPEOUT_UID/lang'},
        {path: '/followers/$followedUid/#WIPEOUT_UID'},
        {path: '/stripe_customers/#WIPEOUT_UID/sources/$chargeId'},
        {path: '/stripe_customers/#WIPEOUT_UID/charges/$sourceId'},
        {path: '/users-say-that/#WIPEOUT_UID/scenes/$scene/nouns'},
        {path: '/users-say-that/#WIPEOUT_UID/scenes/$scene/in_progress'}
        ];
    return expect(inferredDeletePaths).to.deep.equal(userPaths);
  });

});
