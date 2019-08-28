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

// Initializes the Demo.
function Demo() {
  // Shortcuts to DOM Elements.
  this.fileInput = document.getElementById('demo-file');
  this.linkContainer = document.getElementById('demo-link');
  this.metadataContainer = document.getElementById('demo-metadata');

  // Other attributes
  this.metadataRef = undefined;

  // Event bindings.
  this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
  firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this));
}

/**
 * Triggered when the Firebase auth state changes.
 */
Demo.prototype.onAuthStateChanged = function(user) {
  if (user) {
    console.log('Anonymous user signed-in.', user);
    this.fileInput.disabled = false;
  } else {
    console.log('There was no anonymous session. Creating a new anonymous user.');
    // Sign the user in anonymously since accessing Storage requires the user to be authenticated.
    firebase.auth().signInAnonymously();
  }
};

/**
 * Triggered when a user selects a file using the file picker.
 */
Demo.prototype.handleFileSelect = function(e) {
  this.fileInput.true = false;
  e.stopPropagation();
  e.preventDefault();
  var file = e.target.files[0];

  // If we were already listening for metadata from a previously uploaded file we stop listening.
  if (this.metadataRef) {
    this.metadataRef.off();
  }

  var metadata = {
    contentType: file.type
  };

  // Save the image on Cloud Storage.
  var filePath = String(Date.now()) + '/' + file.name;
  firebase.storage().ref(filePath).put(file, metadata).then(function(snapshot) {
    console.log('Uploaded', snapshot.totalBytes, 'bytes.');

    snapshot.ref.getDownloadURL().then(function(downloadURL) {
      var url = downloadURL;
      console.log('File available at', url);
      this.linkContainer.innerHTML = '<a href="' + url + '">/' + filePath + '</a>';
    }.bind(this));

    this.fileInput.disabled = false;
  }.bind(this)).catch(function(error) {
    console.error('Upload failed:', error);
    this.linkContainer.innerHTML = '';
    this.fileInput.disabled = false;
  }.bind(this));

  // Start listening for the metadata which will be added to the Realtime DB.
  this.metadataRef = firebase.database().ref(Demo.makeKeyFirebaseCompatible(filePath));
  this.metadataRef.on('value', function(snapshot) {
    var metadata = snapshot.val();
    this.metadataContainer.innerHTML = metadata ? JSON.stringify(metadata, null, '  ') : '';
  }.bind(this));
};

/**
 * Makes sure the given string does not contain characters that can't be used as Firebase
 * Realtime Database keys such as '.' and replaces them by '*'.
 */
Demo.makeKeyFirebaseCompatible = function(key) {
  return key.replace(/\./g, '*');
};

// Bindings on load.
window.addEventListener('load', function() {
  window.demo = new Demo();
});
