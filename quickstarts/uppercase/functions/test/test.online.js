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

// You can run these unit tests by running "npm test" inside the uppercase/functions directory.

// Chai is a commonly used library for creating unit test suites. It is easily extended with plugins.
const chai = require('chai');
const assert = chai.assert;

// Chai As Promised extends Chai so that a test function can be asynchronous with promises instead
// of using callbacks. It is recommended when testing Cloud Functions for Firebase due to its heavy
// use of Promises.
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

// Sinon is a library used for mocking or verifying function calls in JavaScript.
const sinon = require('sinon');

const admin = require('firebase-admin');
// Require and initialize firebase-functions-test with your project's credentials and service account key.
const test = require('firebase-functions-test')({
  projectId: 'my-project',
  databaseURL: 'https://my-project.firebaseio.com'
}, './service-account-key.json');

describe('Cloud Functions', () => {
  var myFunctions;

  before(() => {
    // Require index.js and save the exports inside a namespace called myFunctions.
    // This includes our cloud functions, which can now be accessed at myFunctions.makeUppercase
    // and myFunctions.addMessage
    myFunctions = require('../index');
  });

  after(() => {
    // Do cleanup tasks.
    test.cleanUp();
    // Reset the database.
    admin.database().ref('messages').remove();
  });

  describe('makeUpperCase', () => {
    // Test Case: setting messages/11111/original to 'input' should cause 'INPUT' to be written to
    // messages/11111/uppercase
    it('should upper case input and write it to /uppercase', () => {
      // Create a DataSnapshot with the value 'input' and the reference path 'messages/11111/original'.
      const snap = test.database.makeDataSnapshot('input', 'messages/11111/original');

      // [START verifyDataWrite]
      // Wrap the makeUppercase function
      const wrapped = test.wrap(myFunctions.makeUppercase);
      // Call the wrapped function with the snapshot you constructed.
      return wrapped(snap).then(() => {
        // Read the value of the data at messages/11111/uppercase. Because `admin.initializeApp()` is
        // called in functions/index.js, there's already a Firebase app initialized. Otherwise, add
        // `admin.initializeApp()` before this line.
        return admin.database().ref('messages/11111/uppercase').once('value').then((createdSnap) => {
          // Assert that the value is the uppercased version of our input.
          assert.equal(createdSnap.val(), 'INPUT');
        });
      });
      // [END verifyDataWrite]
    })
  });

  describe('addMessage', () => {
    it('should return a 303 redirect', (done) => {
      // [START invokeHTTPS]
      // A fake request object, with req.query.text set to 'input'
      const req = { query: {text: 'input'} };
      // A fake response object, with a stubbed redirect function which does some assertions
      const res = {
        redirect: (code, url) => {
          // Assert code is 303
          assert.equal(code, 303);
          // If the database push is successful, then the URL sent back will have the following format:
          var expectedRef = new RegExp('https://ll-firestore-dev.firebaseio.com/messages/');
          assert.isTrue(expectedRef.test(url));
          done();
        }
      };

      // Invoke addMessage with our fake request and response objects. This will cause the
      // assertions in the response object to be evaluated.
      myFunctions.addMessage(req, res);
      // [END invokeHTTPS]
    });
  });
})
