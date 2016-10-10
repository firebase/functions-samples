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

// Create reference to the database authorized as an admin.
const functions = require('firebase-functions');
const capitalizeSentence = require('capitalize-sentence');
const BadWordsFilter = require('bad-words');
const filter = new BadWordsFilter();

// Moderates messages by lowering all uppercase messages and removing swearwords.
exports.moderator = functions.database()
    .path('/messages/{messageId}').onWrite(event => {
      const message = event.data.val();

      if (message && !message.sanitized) {
        // Retrieved the message values.
        console.log('Retrieved message content: ', message);

        // Run moderation checks on on the message and moderate if needed.
        var moderatedMessage = moderateMessage(message.text);

        // Update the Firebase DB with checked message.
        console.log('Message has been moderated. Saving to DB: ', moderatedMessage);
        return event.data.adminRef.update({
          text: moderatedMessage,
          sanitized: true,
          moderated: message.text !== moderatedMessage
        });
      }
      return null;
    });

// Moderates the given message if appropriate.
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

// Returns true if the string contains swearwords.
String.prototype.containsSwearwords = function() {
  return this !== filter.clean(this);
};

// Hide all swearwords. e.g: Crap => ****.
String.prototype.moderateSwearwords = function() {
  return filter.clean(this);
};

// Detect if the current message is yelling. i.e. there are too many Uppercase
// characters or exclamation points.
String.prototype.isYelling = function() {
  return this.replace(/[^A-Z]/g, '').length > this.length / 2 || this.replace(/[^!]/g, '').length >= 3;
};

// Correctly capitalize the string as a sentence (e.g. uppercase after dots)
// and remove exclamation points.
String.prototype.capitalizeSentence = function() {
  return capitalizeSentence(this.toLowerCase()).replace(/!+/g, '.');
};
