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


/** Initializes the Demo. */
function Demo() {
  document.addEventListener('DOMContentLoaded', function() {
    // Shortcuts to DOM Elements.
    this.signInButton = document.getElementById('demo-sign-in-button');
    this.signOutButton = document.getElementById('demo-sign-out-button');
    this.nameContainer = document.getElementById('demo-name-container');
    this.uidContainer = document.getElementById('demo-uid-container');
    this.deleteButton = document.getElementById('demo-delete-button');
    this.profilePic = document.getElementById('demo-profile-pic');
    this.signedOutCard = document.getElementById('demo-signed-out-card');
    this.signedInCard = document.getElementById('demo-signed-in-card');
    // Demo buttons to populate data.
    this.addDataCard = document.getElementById('demo-add-data-card');
    this.chatButton = document.getElementById('demo-chat-button');
    this.basicButton = document.getElementById('demo-basic-button');
    this.tokenButton = document.getElementById('demo-token-button');
    this.accountsButton = document.getElementById('demo-accounts-button');
    this.record1Button = document.getElementById('demo-record1-button');
    this.record2Button = document.getElementById('demo-record2-button');

    // Bind events.
    this.signInButton.addEventListener('click', this.signIn.bind(this));
    this.signOutButton.addEventListener('click', this.signOut.bind(this));
    this.deleteButton.addEventListener('click', this.deleteAccount.bind(this));
    firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this));
    // Bind demo buttons.
    this.chatButton.addEventListener('click', this.chat.bind(this));
    this.basicButton.addEventListener('click', this.basic.bind(this));
    this.tokenButton.addEventListener('click', this.token.bind(this));
    this.accountsButton.addEventListener('click', this.accounts.bind(this));
    this.record1Button.addEventListener('click', this.record.bind(this, 2015));
    this.record2Button.addEventListener('click', this.record.bind(this, 2017));
    // Demo variables
    this.chatRoomId = 1;
  }.bind(this));
}

// Triggered on Firebase auth state change.
Demo.prototype.onAuthStateChanged = function(user) {
  if (user) {
    this.nameContainer.innerText = user.displayName;
    this.uidContainer.innerText = user.uid;
    this.profilePic.src = user.photoURL;
    this.signedOutCard.style.display = 'none';
    this.addDataCard.style.display = 'block';
    this.signedInCard.style.display = 'block';
    this.user = user;
  } else {
    this.signedOutCard.style.display = 'block';
    this.signedInCard.style.display = 'none';
    this.addDataCard.style.display = 'none';
  }
};


Demo.prototype.basic = function() {
  firebase.database().ref('/users/' + this.user.uid).set('Basic tests');
};

Demo.prototype.token = function() {
  firebase.database().ref('/thirdPartyToken/' + this.user.uid).set('token');
};

Demo.prototype.addDataDemo = function(body) {
  var xhttp = new XMLHttpRequest();
  body.uid = this.user.uid;
  xhttp.open('POST', '/addDataDemo', true);
  xhttp.send(
    JSON.stringify(body),
    function(er, res, body) {
      console.log(er, res, body);
    }
  );
};


Demo.prototype.chat = function() {
  var body = {
    ref: '/chat/room' + this.chatRoomId,
    content: {creator: this.user.uid, members: [1, 2, 3], name: 'Chat Name'}};
  this.addDataDemo(body);
  this.chatRoomId += 1;
};

Demo.prototype.accounts = function() {
  var cont = {
    githubToken: 'TOKEN',
    profileNeedsUpdate: 'FOO',
    events: [1, 2, 3],
  };
  var body = {ref: '/accounts/' + this.user.uid + '/', content: cont};
  this.addDataDemo(body);
};

Demo.prototype.record = function(year) {
  this.addDataDemo({
      ref: '/record/' + this.user.uid,
      content: {content: 'Record data', createYear: year},
    });
};

/** Initiates the sign-in flow using LinkedIn sign in in a popup. */
Demo.prototype.signIn = function() {
  firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
};

/** Signs-out of Firebase. */
Demo.prototype.signOut = function() {
  firebase.auth().signOut();
};

/** Deletes the user's account. */
Demo.prototype.deleteAccount = function() {
  firebase.auth().currentUser.delete().then(function() {
    window.alert('Account deleted');
  }).catch(function(error) {
    if (error.code === 'auth/requires-recent-login') {
      window.alert(
        'You need to have recently signed-in to delete your account.\n' +
          'Please sign-in and try again.');
      firebase.auth().signOut();
    }
  });
};

/** Load the demo. */
window.demo = new Demo();
