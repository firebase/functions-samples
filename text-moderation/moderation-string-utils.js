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

var capitalizeSentence = require('capitalize-sentence');
var BadWordsFilter = require('bad-words');
var filter = new BadWordsFilter();

// Adds moderation functions to String prototype.
exports.loadModerationStringUtils = function() {

  // Returns true of the string contains swearwords.
  String.prototype.containsSwearwords = function () {
    return this != filter.clean(this);
  };

  // Hide all swearwords. e.g: Crap => ****.
  String.prototype.moderateSwearwords = function () {
    return filter.clean(this);
  };

  // Detect if the current message is yelling. i.e. there are too many Uppercase
  // characters or exclamation points.
  String.prototype.isYelling = function () {
    return this.replace(/[^A-Z]/g, '').length > this.length / 2
      || this.replace(/[^!]/g, '').length >= 3;
  };

  // Correctly capitalize the string as a sentence (e.g. uppercase after dots)
  // and remove exclamation points.
  String.prototype.capitalizeSentence = function () {
    return capitalizeSentence(this.toLowerCase()).replace(/!+/g, '.');
  }
};
