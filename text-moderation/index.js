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

// Create reference to the database authorized as an admin.
var Firebase = require('firebase');
var env = require('./env');
var ref = new Firebase(env.get('firebase.database.url'), 'admin');
ref.authWithCustomToken(env.get('firebase.database.secret'));

// load moderation library.
var stringUtils = require('./moderation-string-utils.js');
stringUtils.loadModerationStringUtils();

// Moderates messages by lowering all uppercase messages and removing swearwords.
exports.moderator = function(context, data) {

  // Read the Firebase DB entry that triggered the function.
  console.log('Loading firebase path: ' + env.get('firebase.database.url') + data.path);
  var messageFirebaseDbRef = ref.child(data.path);
  messageFirebaseDbRef.once('value').then(function(messageData) {

    // Retrieved the message values.
    console.log('Retrieved message content: ' + JSON.stringify(messageData.val()));
    var messageEntryData = messageData.val();

    // Run moderation checks on on the message and moderate if needed.
    var moderatedMessage = moderateMessage(messageEntryData.text, context, messageFirebaseDbRef);

    // Update the Firebase DB with checked message.
    console.log('Message has been moderated. Saving to DB: ' + moderatedMessage);
    messageFirebaseDbRef.update({
      text: moderatedMessage,
      sanitized: true,
      moderated: messageEntryData.text != moderatedMessage
    }).then(context.done);

  // If reading the Firebase DB failed.
  }).catch(context.done);
};

// Moderates the given message if needed.
function moderateMessage(message) {

  // Moderate if the user is Yelling.
  if (message.isYelling()) {
    console.log('User is yelling. moderating...');
    message = message.capitalizeSentence();
  }

  // Moderate if the user uses SwearWords.
  if (message.containsSwearwords()) {
    console.log('User is swearing. moderating...');
    message = message.moderateSwearwords();
  }

  return message;
}
