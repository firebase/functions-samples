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

// Initializes the Demo.
function Demo() {
  document.addEventListener('DOMContentLoaded', function() {
    // Shortcuts to DOM Elements.
    this.signInButton = document.getElementById('demo-sign-in-button');
    this.signOutButton = document.getElementById('demo-sign-out-button');
    this.nameContainer = document.getElementById('demo-name-container');
    this.fcmErrorContainer = document.getElementById('demo-fcm-error-container');
    this.deleteButton = document.getElementById('demo-delete-button');
    this.signedOutCard = document.getElementById('demo-signed-out-card');
    this.signedInCard = document.getElementById('demo-signed-in-card');
    this.usersContainer = document.getElementById('demo-all-users-list');
    this.usersCard = document.getElementById('demo-all-users-card');
    this.snackbar = document.getElementById('demo-snackbar');

    // Bind events.
    this.signInButton.addEventListener('click', this.signIn.bind(this));
    this.signOutButton.addEventListener('click', this.signOut.bind(this));
    this.deleteButton.addEventListener('click', this.deleteAccount.bind(this));
    firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this));
    firebase.messaging().onMessage(this.onMessage.bind(this));
  }.bind(this));
}

// Triggered on Firebase auth state change.
Demo.prototype.onAuthStateChanged = function(user) {
  // If this is just an ID token refresh we exit.
  if (user && this.currentUid === user.uid) {
    return;
  }

  // Remove all Firebase realtime database listeners.
  if (this.listeners) {
    this.listeners.forEach(function(ref) {
      ref.off();
    });
  }
  this.listeners = [];

  // Adjust UI depending on user state.
  if (user) {
    this.nameContainer.innerText = user.displayName;
    this.signedOutCard.style.display = 'none';
    this.signedInCard.style.display = 'block';
    this.usersCard.style.display = 'block';
    firebase.database().ref(`users/${user.uid}`).update({
      displayName: user.displayName,
      photoURL: user.photoURL
    });
    this.saveToken();
    this.displayAllUsers();
    this.currentUid = user.uid;
  } else {
    this.signedOutCard.style.display = 'block';
    this.signedInCard.style.display = 'none';
    this.usersCard.style.display = 'none';
    this.usersContainer.innerHTML = '';
    this.currentUid = null;
  }
};

// Display all users so that they can be followed.
Demo.prototype.displayAllUsers = function() {
  var usersRef = firebase.database().ref('users');
  usersRef.on('child_added', function(snapshot) {
    // Create the HTML for a user.
    var photoURL = snapshot.val().photoURL;
    var displayName = snapshot.val().displayName;
    var uid = snapshot.key;
    var userTemplate =
        '<div class="demo-user-container">' +
        '  <img class="demo-profile-pic" src="' + photoURL + '">' +
        '  <span class="demo-name">' + displayName + '</span>' +
        '  <span class="demo-notifications-enabled">(notifications enabled)</span>' +
        '  <label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="demo-follow-switch-' + uid + '">' +
        '    <input type="checkbox" id="demo-follow-switch-' + uid + '" class="mdl-switch__input">' +
        '    <span class="mdl-switch__label">Follow</span>' +
        '  </label>' +
        '</div>';

    // Create the DOM element from the HTML.
    var div = document.createElement('div');
    div.innerHTML = userTemplate;
    var userElement = div.firstChild;
    this.usersContainer.appendChild(userElement);

    // Activate the Material Design Lite Switch element.
    var materialSwitchContainer = userElement.getElementsByClassName('mdl-switch')[0];
    if (componentHandler) {
      componentHandler.upgradeElement(materialSwitchContainer);
    }

    // Check if the user has notifications enabled and show a flag if he has.
    var notificationEnabledElement = userElement.getElementsByClassName('demo-notifications-enabled')[0];
    var notificationsEnabledRef = snapshot.ref.child('notificationTokens');
    notificationsEnabledRef.on('value', function(notificationsEnabledSnapshot) {
      notificationEnabledElement.style.display = notificationsEnabledSnapshot.hasChildren() ? 'inline' : 'none';
    });
    this.listeners.push(notificationsEnabledRef);

    // Listen for the Switch state from the Realtime database.
    var switchElement = document.getElementById('demo-follow-switch-' + uid);
    var followUserRef = firebase.database().ref('followers/' + uid + '/' + this.currentUid);
    this.listeners.push(followUserRef);
    followUserRef.on('value', function(followSnapshot) {
      switchElement.checked = !!followSnapshot.val();
      if (materialSwitchContainer.MaterialSwitch) {
        materialSwitchContainer.MaterialSwitch.checkDisabled();
        materialSwitchContainer.MaterialSwitch.checkToggleState();
      }
    });

    // Listen for switch state changes from the user.
    switchElement.addEventListener('change', function() {
      followUserRef.set(!!switchElement.checked);
    });
  }.bind(this));
  this.listeners.push(usersRef);
};

// Initiates the sign-in flow using LinkedIn sign in in a popup.
Demo.prototype.signIn = function() {
  var google = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(google);
};

// Signs-out of Firebase.
Demo.prototype.signOut = function() {
  firebase.auth().signOut();
};

// Deletes the user's account.
Demo.prototype.deleteAccount = function() {
  return firebase.database().ref('users/' + this.currentUid).remove().then(function() {
    return firebase.auth().currentUser.delete().then(function() {
      window.alert('Account deleted');
    }).catch(function(error) {
      if (error.code === 'auth/requires-recent-login') {
        window.alert('You need to have recently signed-in to delete your account. Please sign-in and try again.');
        firebase.auth().signOut();
      }
    });
  });
};

// Called when a notification is received while the app is in focus.
Demo.prototype.onMessage = function(payload) {
  console.log('Notifications received.', payload);

  // If we get a notification while focus on the app
  if (payload.notification) {
    let data = {
      message: payload.notification.body
    };
    this.snackbar.MaterialSnackbar.showSnackbar(data);
  }
};

// Saves the token to the database if available. If not request permissions.
Demo.prototype.saveToken = function() {
  firebase.messaging().getToken().then(function(currentToken) {
    if (currentToken) {
      firebase.database().ref('users/' + this.currentUid + '/notificationTokens/' + currentToken).set(true);
    } else {
      this.requestPermission();
    }
  }.bind(this)).catch(function(err) {
    console.error('Unable to get messaging token.', err);
    if (err.code === 'messaging/permission-default') {
      this.fcmErrorContainer.innerText = 'You have not enabled notifications on this browser. To enable notifications reload the page and allow notifications using the permission dialog.';
    } else if (err.code === 'messaging/notifications-blocked') {
      this.fcmErrorContainer.innerHTML = 'You have blocked notifications on this browser. To enable notifications follow these instructions: <a href="https://support.google.com/chrome/answer/114662?visit_id=1-636150657126357237-2267048771&rd=1&co=GENIE.Platform%3DAndroid&oco=1">Android Chrome Instructions</a><a href="https://support.google.com/chrome/answer/6148059">Desktop Chrome Instructions</a>';
    }
  }.bind(this));
};

// Requests permission to send notifications on this browser.
Demo.prototype.requestPermission = function() {
  console.log('Requesting permission...');
  firebase.messaging().requestPermission().then(function() {
    console.log('Notification permission granted.');
    this.saveToken();
  }.bind(this)).catch(function(err) {
    console.error('Unable to get permission to notify.', err);
  });
};

// Load the demo.
window.demo = new Demo();
