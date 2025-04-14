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
"use strict";

// Initializes the Demo.
function Demo() {
  document.addEventListener(
    "DOMContentLoaded",
    function () {
      // Shortcuts to DOM Elements.
      this.signInButton = document.getElementById("demo-sign-in-button");
      this.signOutButton = document.getElementById("demo-sign-out-button");
      this.nameContainer = document.getElementById("demo-name-container");
      this.uidContainer = document.getElementById("demo-uid-container");
      this.deleteButton = document.getElementById("demo-delete-button");
      this.profilePic = document.getElementById("demo-profile-pic");
      this.signedOutCard = document.getElementById("demo-signed-out-card");
      this.signedInCard = document.getElementById("demo-signed-in-card");

      // Bind events.
      this.signInButton.addEventListener("click", this.signIn.bind(this));
      this.signOutButton.addEventListener("click", this.signOut.bind(this));
      this.deleteButton.addEventListener(
        "click",
        this.deleteAccount.bind(this),
      );
      firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this));
    }.bind(this),
  );
}

// Triggered on Firebase auth state change.
Demo.prototype.onAuthStateChanged = function (user) {
  if (user) {
    this.nameContainer.innerText = user.displayName;
    this.uidContainer.innerText = user.uid;
    this.profilePic.src = user.photoURL;
    this.signedOutCard.style.display = "none";
    this.signedInCard.style.display = "block";
  } else {
    this.signedOutCard.style.display = "block";
    this.signedInCard.style.display = "none";
  }
};

// Initiates the sign-in flow using LinkedIn sign in in a popup.
Demo.prototype.signIn = function () {
  // Open the popup that will start the auth flow.
  window.open("popup.html", "name", "height=585,width=400");
};

// Signs-out of Firebase.
Demo.prototype.signOut = function () {
  firebase.auth().signOut();
};

// Deletes the user's account.
Demo.prototype.deleteAccount = function () {
  firebase
    .auth()
    .currentUser.delete()
    .then(function () {
      window.alert("Account deleted");
    })
    .catch(function (error) {
      if (error.code === "auth/requires-recent-login") {
        window.alert(
          "You need to have recently signed-in to delete your account. Please sign-in and try again.",
        );
        firebase.auth().signOut();
      }
    });
};

// Load the demo.
new Demo();
