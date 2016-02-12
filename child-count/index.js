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

var Firebase = require('firebase');
var env = require('./env');
var ref = new Firebase(env.get('firebase.database.url'), 'admin');
ref.auth(env.get('firebase.database.token'));

// Keeps track of the length of the 'likes' child list in a separate attribute.
exports.countlikes = function(context, data) {
  var nodeRef = ref.child(data.path);
  console.log('Authenticated successfully with admin rights');
  nodeRef.once('value').then(function(likesData) {
    nodeRef.parent().child('likes_count').set(likesData.numChildren())
        .then(context.done).catch(context.done);
  }).catch(context.done);
};