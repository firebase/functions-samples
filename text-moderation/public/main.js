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

// Initializes the Guestbook.
function Guestbook() {

  // Shortcuts to DOM Elements.
  this.messageList = document.getElementById('message-list');
  this.messageForm = document.getElementById('message-form');
  this.messageInput = document.getElementById('message');
  this.nameInput = document.getElementById('name');
  this.submitButton = document.getElementById('submit');

  // Saves message on form submit.
  this.messageForm.addEventListener('submit', this.saveMessage.bind(this));

  // Toggle for the button.
  var buttonTogglingHandler = this.toggleButton.bind(this);
  this.messageInput.addEventListener('keyup', buttonTogglingHandler);
  this.nameInput.addEventListener('keyup', buttonTogglingHandler);
  this.messageInput.addEventListener('change', buttonTogglingHandler);
  this.nameInput.addEventListener('change', buttonTogglingHandler);

  // Function calling displayMessage with correct attributes from Firebase data.
  var callDisplayMessage = function (data) {
    var val = data.val();
    this.displayMessage(data.key, val.name, val.text, val.moderated);
  }.bind(this);

  // Loads the last 12 messages and listen for new ones.
  Guestbook.fbMessagesRef.limitToLast(12).on('child_added', callDisplayMessage);
  // Listen for messages updates.
  Guestbook.fbMessagesRef.limitToLast(12).on('child_changed', callDisplayMessage);
  // Listen for messages updates.
  Guestbook.fbMessagesRef.limitToLast(12).on('child_removed', callDisplayMessage);
}

// Reference to the new messages feed in the Firebase DB.
Guestbook.fbMessagesRef = firebase.database().ref('/messages');

// Saves a new message on the Firebase DB.
Guestbook.prototype.saveMessage = function(e) {
  e.preventDefault();
  if (this.messageInput.value && this.nameInput.value) {
    Guestbook.fbMessagesRef.push({
      name: this.nameInput.value,
      text: this.messageInput.value,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    }, function (error) {
      if (error) {
        console.log(error);
      } else {
        Guestbook.resetMaterialTextfield(this.messageInput);
        Guestbook.resetMaterialTextfield(this.nameInput);
        this.toggleButton();
      }
    }.bind(this));
  }
};

// Resets the given MaterialTextField.
Guestbook.resetMaterialTextfield = function(element) {
  element.value = '';
  element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
  element.blur();
};

// Template for message cards.
Guestbook.MESSAGE_CARD_TEMPLATE =
  '<div class="mdl-card mdl-cell mdl-cell--12-col mdl-card__supporting-text mdl-shadow--2dp ' +
              'message-card mdl-cell--4-col-tablet mdl-cell--4-col-desktop">' +
      '<div class="message"></div>' +
      '<div class="author"></div>' +
      '<div class="moderated">(This message has been moderated)</div>' +
  '</div>';

// Displays a Visitor's Book Message in the UI.
Guestbook.prototype.displayMessage = function(key, name, message, moderated) {
  var div = document.getElementById(key);
  // If an element for that message does not exists yet we create it.
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = Guestbook.MESSAGE_CARD_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
    this.messageList.insertBefore(div, document.getElementById('message-title').nextSibling);
  }
  div.querySelector('.author').textContent = name;
  div.querySelector('.moderated').style.visibility = moderated ? 'visible' : 'hidden';
  var messageElement = div.querySelector('.message');
  messageElement.textContent = message;
  // Replace all line breaks by <br>.
  messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
  // Show the card fading-in.
  setTimeout(function() {div.classList.add('visible')}, 1);
};

// Enables or disables the submit button depending on the values of the input
// fields.
Guestbook.prototype.toggleButton = function() {
  if (this.messageInput.value && this.nameInput.value) {
    this.submitButton.removeAttribute('disabled');
  } else {
    this.submitButton.setAttribute('disabled', 'true');
  }
};

// Bindings on load.
window.addEventListener('load', function() {
  new Guestbook();
});
