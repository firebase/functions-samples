/**
 * Copyright 2015 Google Inc. All Rights Reserved.
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

// Create an all access Firebase Database reference.
var Firebase = require('firebase');
var env = require('./env');
var ref = new Firebase(env.get('firebase.database.url'), 'admin');
ref.auth(env.get('firebase.database.token'));

// Max number of lines of the chat history.
var MAX_LOG_COUNT = 5;

// Removes siblings of the node that element that triggered the function if there are more than MAX_LOG_COUNT
function truncate(context, data) {
  var parentRef = ref.child(data.path).parent();
  parentRef.once('value', function(snapshot) {
    if (snapshot.numChildren() > MAX_LOG_COUNT) {
      var childCount = 0;
      var updates = {};
      snapshot.forEach(function (child) {
        if (++childCount < snapshot.numChildren() - MAX_LOG_COUNT) {
          updates[child.key()] = null;
        }
      });
      // Update the parent. This effectiovely removes the extra children.
      parentRef.update(updates, context.done);
    } else {
      context.done();
    }
  });
}

module.exports = {
  truncate: truncate
};