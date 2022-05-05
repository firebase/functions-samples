/**
 * Copyright 2022 Google Inc. All Rights Reserved.
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
"use strict";

const capitalizeSentence = require("capitalize-sentence");
const Filter = require("bad-words");
const badWordsFilter = new Filter();

// Sanitizes the given text if needed by replacing bad words with '*'.
exports.sanitizeText = (text) => {
  // Re-capitalize if the user is Shouting.
  if (isShouting(text)) {
    console.log("User is shouting. Fixing sentence case...");
    text = stopShouting(text);
  }

  // Moderate if the user uses SwearWords.
  if (containsSwearwords(text)) {
    console.log("User is swearing. moderating...");
    text = replaceSwearwords(text);
  }

  return text;
};

/**
 * Returns true if the string contains swearwords.
 * @param {string} message
 * @return {boolean}
 */
function containsSwearwords(message) {
  return message !== badWordsFilter.clean(message);
}

/**
 * Hide all swearwords. e.g: Crap => ****.
 * @param {string} message
 * @return {string}
 */
function replaceSwearwords(message) {
  return badWordsFilter.clean(message);
}

/**
 * Detect if the current message is shouting. i.e. there are too many Uppercase
 * characters or exclamation points.
 * @param {string} message message to be analyzed
 * @return {boolean}
 */
function isShouting(message) {
  return message.replace(/[^A-Z]/g, "").length > message.length / 2 ||
   message.replace(/[^!]/g, "").length >= 3;
}

/**
 * Correctly capitalize the string as a sentence (e.g. uppercase after dots)
 * and remove exclamation ppints.
 * @param {string} message message to capitalize
 * @return {string} capitalized string
 */
function stopShouting(message) {
  return capitalizeSentence(message.toLowerCase()).replace(/!+/g, ".");
}
