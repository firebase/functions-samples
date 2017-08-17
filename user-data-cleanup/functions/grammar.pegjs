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
 

/**
 * Storage rules grammar specification for PEG.js parser generator.
 * Usage: To generate the parse code, run
 * `npm install -g pegjs; pegjs grammar.pegjs` under
 * the functions folder, the output is named grammar.js by default
 * To use the parser:
 * const parser = require('./grammar');
 * const obj = parser.parse(ruleString);
 */

{
  function createMatch(path, read, write, matchLists = undefined) {
    let match = {};
    let obj = {};
    if (typeof read !== 'undefined') {
      obj['.read'] = read;
    }
    if (typeof write !== 'undefined') {
      obj['.write'] = write;
    }
    if (!(typeof matchLists === 'undefined') && !(matchLists === null)) {
      for (var index = 0; index < matchLists.length; index++) {
        const path = Object.keys(matchLists[index])[0];
        const value = matchLists[index][path];
        obj[path] = value;
      }
    }
    match[path] = obj
    return match;
  }

  function combineAccess(allows){
    let access = {};
    for (let index = 0; index < allows.length; index++) {
      let a = allows[index];
      if (Object.keys(a).indexOf('read') > -1) {
        access['read'] = a['read'];
      }
      if (Object.keys(a).indexOf('write') > -1) {
        access['write'] = a['write'];
      }
      if (Object.keys(a).indexOf('writeRead') > -1) {
        access['read'] = a['writeRead'];
        access['write'] = a['writeRead'];
      }
    }
    return access;
  }
}

rules = _ 'service firebase.storage' _ '{' match:match '}' 
  { return match; }

match = _ 'match' _ path:path _ '{' access:allows? submatch:matchList? '}' _
  { return createMatch(path, access['read'], access['write'], submatch); }
    
matchList = _ first:match rest:( _ item:match { return item; })* _
  { return [first].concat(rest ? rest :[]); }
           
path = chs:[/{}A-Za-z0-9=*]+ _
  { return chs.join(''); }

allows = list:allow* _
  { return combineAccess(list); }

allow = _ 'allow' _ 'read' exp:expression _
  { return {'read':exp}; }/
      _ 'allow' _ 'write' exp:expression _
  { return {'write':exp}; }/
      _ 'allow' _ 'write' _ ',' _ 'read' exp:expression _
  { return {'writeRead':exp}; }/
      _ 'allow' _ 'read' _ ',' _ 'write' exp:expression _
  { return {'writeRead':exp}; }

expression = _ ':' _ 'if' _ exp:[A-Za-z0-9.=;! ]* _
  { return exp.join('');} /
      _';' 
  { return 'true';}

_  = [ \t\n\r]*
