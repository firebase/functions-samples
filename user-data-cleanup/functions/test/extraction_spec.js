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

const testCommon = require('./test_common');
const exp = require('../expression');
const expect = testCommon.expect;
const fs = require('fs');
const jsep = require('jsep');
const rules = require('../parse_rule');
const refs = require('../eval_ref');

const wipeout = require('../wipeout');

// path is only used to repalce 'data' variable in write rule,
// otherwise uses dummy path in tests.
const pathHolder = ['rules', '#'];

const expectAccess = (rule, access, path = pathHolder) =>
    expect(rules.parseWriteRule(rule, path).getAccessStatus())
    .to.equal(access);

const expectVars = (rule, vars, path = pathHolder) =>
    expect(rules.parseWriteRule(rule, path).getVariableList())
    .to.deep.equal(vars);

const expectCond = (rule, cond, path = pathHolder) =>
    expect(rules.parseWriteRule(rule, path).getCondition()).to.equal(cond);

const expectRef = (rule, result, path = pathHolder) => {
  const obj = jsep(rule);
  return expect(refs.evalRef(obj, path)).to.equal(result);
};

const expectRefErr = (rule, err, path = pathHolder) => {
  const obj = jsep(rule);
  expect(() => refs.evalRef(obj, path)).to.throw(err);
};

describe('Auto generation of rules', () => {
  it('should get correct access from write rules', () => {
    expectAccess('true', exp.MULT_ACCESS);
    expectAccess('false', exp.NO_ACCESS);
    expectAccess('auth.uid == $user', exp.SINGLE_ACCESS);
    expectAccess('auth.uid === $user', exp.SINGLE_ACCESS);
    expectAccess('$user === auth.uid', exp.SINGLE_ACCESS);
    expectAccess('$random_name === auth.uid', exp.SINGLE_ACCESS);
    expectVars('$random_name === auth.uid', ['$random_name']);
    expectAccess('auth.uid == null', exp.NO_ACCESS);
    expectAccess('auth.uid != null', exp.MULT_ACCESS);
    expectAccess('auth.uid == ADMIN', exp.NO_ACCESS);
  });//

  it('should deal with logic expressions correctly', () => {
    expectAccess('auth.uid==$user || true', exp.MULT_ACCESS);
    expectAccess('auth.uid==$user || false', exp.SINGLE_ACCESS);
    expectAccess('auth.uid==$user && true', exp.SINGLE_ACCESS);
    expectAccess('auth.uid==$user && false', exp.NO_ACCESS);//

    expectVars('auth.uid==$user || false', ['$user']);
    expectVars('auth.uid==$user && true', ['$user']);//

    expectAccess('auth.uid == $k1 && auth.uid == $k2', exp.SINGLE_ACCESS);
    expectAccess('auth.uid == $k1 || auth.uid == $k2', exp.MULT_ACCESS);
    expectAccess('auth.uid == $k1 && (auth.uid == $k2 || auth.uid == $k3)',
        exp.MULT_ACCESS);
  });

  it('should deal with additional access from hierarchical rules', () => {
    const ruleTree = {
      'rules': {
        'room': {
          '$creator': {
            '.write': 'auth.uid === $creator',
            '$member': {
              '.write': 'auth.uid != null'
            }
          }
        }
      }
    };
    expect(wipeout.inferWipeoutRule(ruleTree)).to.deep
        .equal([
        {path: '/room/#WIPEOUT_UID'},
        {except: '/room/$creator/$member'}]);
  });

  describe('should deal with data references', () => {
    it('should throw an error for invalid data references', () => {
      // Invalid functions
      expectRefErr(`data.sibling()`,
          `Only support reference child(), parent(), val() \
and exists() now, sibling found`);
      // Needs to be a value instead of a location reference.
      expectRefErr(`data.child('a')`,
          `Not a valid referece value. Did you forget .val() at the end?`);
      // Invalide arguments
      expectRefErr(`data.child().val()`, `Needs a argument for child ()`);
      expectRefErr(`data.child('arg').parent('arg')`,
          `Only supports argument for child()`);
      expectRefErr(`data.val('arg')`, `Only supports argument for child()`);
      expectRefErr(`data.exists('arg')`, `Only supports argument for child()`);
      // No valid parent
      expectRefErr(`data.parent()`, `No parent avaliable`);
    });

    it('should extract correct content for data references', () => {
      // references containing newData should evaluates to undefined.
      expectRef(`newData.child('from').val()`, null);
      // functions val(), exists(), parent(), child()
      expectRef(`data.val()`, `val(rules,doc,$uid,create)`,
         ['rules', 'doc', '$uid', 'create']);
      expectRef(`data.child('acc').val()`, `val(rules,users,acc)`,
         ['rules', 'users']);
      expectRef(`data.child('acc').parent().val()`, `val(rules,users)`,
         ['rules', 'users']);
      expectRef(`data.child('acc').parent().child('acc2').val()`,
         `val(rules,users,acc2)`, ['rules', 'users']);
      expectRef(`data.child('acc').parent().child('acc2').exists()`,
          `exists(rules,users,acc2)`, ['rules', 'users']);
      // variable root
      expectRef(`root.child('acc').val()`, `val(rules,acc)`);
      // complex arguments
      expectRef(`root.child('rooms').child(data.child('creator').val()).val()`,
          `val(rules,rooms,val(rules,rooms,$roomid,creator))`,
          ['rules', 'rooms', '$roomid']);
      expectRef(
          `root.child('rooms').child($roomid).child('members')\
.child(auth.uid).val()`,
          `val(rules,rooms,$roomid,members,#WIPEOUT_UID)`);
    });
  });

  it('should deal with condition', () => {
    expectCond(`auth.uid === $uid && data.child('name').val() !== null`,
        'val(rules,users,$uid,name) !== null', ['rules','users','$uid']);
    expectAccess(`auth.uid === $uid && data.child('name').val() !== null`,
        exp.SINGLE_ACCESS, ['rules', 'users', '$uid']);
  });

  it('should extract correct wipeout rules from RTBD rules ', () => {
    const DBRules = fs.readFileSync('test/DBRules.json', 'utf-8');
    const inferredDeletePaths = wipeout.extractFromDBRules(DBRules);
    const userPaths = [
        {path: '/users/#WIPEOUT_UID'},
        {path: '/instagramAccessToken/#WIPEOUT_UID'},
        {
          condition: `val(rules,users2,#WIPEOUT_UID,test) !== null && \
exists(rules,users2,#WIPEOUT_UID)`,
          path: '/users2/#WIPEOUT_UID'
        },
        {path: '/accounts/#WIPEOUT_UID/githubToken'},
        {path: '/accounts/#WIPEOUT_UID/profileNeedsUpdate'},
        {path: '/users-say-that/#WIPEOUT_UID/lang'},
        {
          condition: '#WIPEOUT_UID > 1000',
          path: '/followers/$followedUid/#WIPEOUT_UID'
        },
        { 
          condition: "#WIPEOUT_UID === val(rules,stripe_customers,$uid,charges)",
          path: '/stripe_customers/$uid/sources/$chargeId'
        },
        {path: '/stripe_customers/#WIPEOUT_UID/charges/$sourceId'},
        {path: '/users-say-that/#WIPEOUT_UID/scenes/$scene/nouns'},
        {path: '/users-say-that/#WIPEOUT_UID/scenes/$scene/in_progress'}
        ];
    return expect(inferredDeletePaths).to.deep.equal(userPaths);
  });
});
