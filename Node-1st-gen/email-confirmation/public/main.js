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
"use strict";

// Initializes the Demo.
function Demo() {
  // Shortcuts to DOM Elements.
  this.signInButton = document.getElementById("demo-sign-in-button");
  this.signOutButton = document.getElementById("demo-sign-out-button");
  this.subscribeButton = document.getElementById("demo-subscribe-button");
  this.unsubscribeButton = document.getElementById("demo-unsubscribe-button");
  this.emailContainer = document.getElementById("demo-email-container");
  this.subscribedTextContainer = document.getElementById(
    "demo-subscribed-text-container",
  );
  this.unsubscribedTextContainer = document.getElementById(
    "demo-unsubscribed-text-container",
  );
  this.nameContainer = document.getElementById("demo-name-container");
  this.signedOutCard = document.getElementById("demo-signed-out-card");
  this.signedInCard = document.getElementById("demo-signed-in-card");

  // Bind events.
  this.signInButton.addEventListener("click", this.signIn.bind(this));
  this.signOutButton.addEventListener("click", this.signOut.bind(this));
  this.subscribeButton.addEventListener("click", this.subscribe.bind(this));
  this.unsubscribeButton.addEventListener("click", this.unsubscribe.bind(this));
  firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this));
}

Demo.prototype.onAuthStateChanged = function (user) {
  if (user) {
    this.nameContainer.innerText = user.displayName;
    this.emailContainer.innerText = user.email;
    this.signedOutCard.style.display = "none";
    this.signedInCard.style.display = "block";
    this.userRef = firebase.database().ref("users/" + user.uid);
    this.userRef.on(
      "value",
      function (data) {
        if (data.val() && data.val().subscribedToMailingList) {
          this.subscribedTextContainer.style.display = "block";
          this.unsubscribedTextContainer.style.display = "none";
          this.subscribeButton.style.display = "none";
          this.unsubscribeButton.style.display = "inline-block";
        } else {
          this.subscribedTextContainer.style.display = "none";
          this.unsubscribedTextContainer.style.display = "block";
          this.subscribeButton.style.display = "inline-block";
          this.unsubscribeButton.style.display = "none";
        }
      }.bind(this),
    );
  } else {
    if (this.userRef) {
      this.userRef.off();
    }
    this.signedOutCard.style.display = "block";
    this.signedInCard.style.display = "none";
  }
};

// Signs-in Firebase.
Demo.prototype.signIn = function () {
  firebase
    .auth()
    .signInWithPopup(new firebase.auth.GoogleAuthProvider())
    .then(
      function (result) {
        // If the user signs-in we automatically signs-him up for the newsletter.
        this.onAuthStateChanged(result.user);
        this.subscribe();
      }.bind(this),
    );
};

// Signs-out of Firebase.
Demo.prototype.signOut = function () {
  firebase.auth().signOut();
};

// Subscribe to the newsletter.
Demo.prototype.subscribe = function () {
  return firebase
    .database()
    .ref("users/" + firebase.auth().currentUser.uid)
    .set({
      subscribedToMailingList: true,
      email: firebase.auth().currentUser.email,
    });
};

// Unsubscribe to the newsletter.
Demo.prototype.unsubscribe = function () {
  return firebase
    .database()
    .ref(
      "users/" + firebase.auth().currentUser.uid + "/subscribedToMailingList",
    )
    .set(false);
};

// Bindings on load.
window.addEventListener("load", function () {
  window.demo = new Demo();
});
