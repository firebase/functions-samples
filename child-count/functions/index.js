/**
 * Copyright 2016 Google Inc. All Rights Reserved.
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

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// Keeps track of the length of the 'likes' child list in a separate property.
exports.countlikechange = functions.database.ref("/posts/{postid}/likes/{likeid}").onWrite((event) => {
  var collectionRef = event.data.ref.parent;
  var countRef = collectionRef.parent.child('likes_count');

  return countRef.transaction(function(current) {
    if (event.data.exists() && !event.data.previous.exists()) {
      return (current || 0) + 1;
    }
    else if (!event.data.exists() && event.data.previous.exists()) {
      return (current || 0) - 1;
    }
  });
});

// If the number of likes gets deleted, recount the number of likes
exports.recountlikes = functions.database.ref("/posts/{postid}/likes_count").onWrite((event) => {
  if (!event.data.exists()) {
    var counterRef = event.data.ref;
    var collectionRef = counterRef.parent.child('likes');
    return collectionRef.once('value').then(function(messagesData) {
      return counterRef.set(messagesData.numChildren());
    });
  }
});
