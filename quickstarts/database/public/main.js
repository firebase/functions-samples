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

var database = firebase.app().database();
var messagesRef = database.ref().child('messages');

// Shortcuts to DOM Elements.
var messageList = document.getElementById('message-list');
var messageForm = document.getElementById('message-form');
var messageInput = document.getElementById('message');

// Saves a new message on the Firebase DB.
function saveMessage(e) {
  e.preventDefault();
  if (messageInput.value) {
    messagesRef.push(messageInput.value);
    messageInput.value = '';
  }
}

// Add/Updates a message in the UI.
function displayMessage(key, message) {
  var div = document.getElementById(key);
  if (!div) {
    div = document.createElement('div');
    div.setAttribute('id', key);
    messageList.insertBefore(div, messageList.firstChild);
  }
  div.textContent = message;
}

// Bindings on load.
window.addEventListener('load', function() {
  // Saves message on form submit.
  messageForm.addEventListener('submit', saveMessage);

  var displayMessageFromFirebaseData = function(data) {
    displayMessage(data.key, data.val());
  };
  // Loads the last 10 messages and listen for new ones.
  messagesRef.limitToLast(10).on('child_added', displayMessageFromFirebaseData);
  // Listen for messages updates.
  messagesRef.limitToLast(10).on('child_changed', displayMessageFromFirebaseData);
}, false);
