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
// Visit https://firebase.google.com/docs/functions/unit-testing to learn more
// about using the `firebase-functions-test` SDK.

// Chai is a commonly used library for creating unit test suites. It is easily extended with plugins.
const chai = require('chai');
const assert = chai.assert;

// Sinon is a library used for mocking or verifying function calls in JavaScript.
const sinon = require('sinon');

// Require firebase-admin so we can stub out some of its methods.
const admin = require('firebase-admin');
// Require and initialize firebase-functions-test. Since we are not passing in any parameters, it will
// be initialized in an "offline mode", which means we have to stub out all the methods that interact
// with Firebase services.
const test = require('firebase-functions-test')();

describe('Cloud Functions', () => {
  let myFunctions, adminInitStub;

  before(() => {
    // [START stubAdminInit]
    // If index.js calls admin.initializeApp at the top of the file,
    // we need to stub it out before requiring index.js. This is because the
    // functions will be executed as a part of the require process.
    // Here we stub admin.initializeApp to be a dummy function that doesn't do anything.
    adminInitStub = sinon.stub(admin, 'initializeApp');
    // Now we can require index.js and save the exports inside a namespace called myFunctions.
    myFunctions = require('../index');
    // [END stubAdminInit]
  });

  after(() => {
    // Restore admin.initializeApp() to its original method.
    adminInitStub.restore();
    // Do other cleanup tasks.
    test.cleanup();
  });

  describe('makeUpperCase', () => {
    // Test Case: setting messages/{pushId}/original to 'input' should cause 'INPUT' to be written to
    // messages/{pushId}/uppercase
    it('should upper case input and write it to /uppercase', () => {
      // [START assertOffline]
      const childParam = 'uppercase';
      const setParam = 'INPUT';
      // Stubs are objects that fake and/or record function calls.
      // These are excellent for verifying that functions have been called and to validate the
      // parameters passed to those functions.
      const childStub = sinon.stub();
      const setStub = sinon.stub();
      // [START fakeSnap]
      // The following lines creates a fake snapshot, 'snap', which returns 'input' when snap.val() is called,
      // and returns true when snap.ref.parent.child('uppercase').set('INPUT') is called.
      const snap = {
        val: () => 'input',
        ref: {
          parent: {
            child: childStub,
          }
        }
      };
      childStub.withArgs(childParam).returns({ set: setStub });
      setStub.withArgs(setParam).returns(true);
      // [END fakeSnap]
      // Wrap the makeUppercase function.
      const wrapped = test.wrap(myFunctions.makeUppercase);
      // Since we've stubbed snap.ref.parent.child(childParam).set(setParam) to return true if it was
      // called with the parameters we expect, we assert that it indeed returned true.
      return wrapped(snap).then(makeUppercaseResult => {
        return assert.equal(makeUppercaseResult, true);
      });
      // [END assertOffline]
    })
  });

  describe('addMessage', () => {
    let oldDatabase;
    before(() => {
      // Save the old database method so it can be restored after the test.
      oldDatabase = admin.database;
    });

    after(() => {
      // Restoring admin.database() to the original method.
      admin.database = oldDatabase;
    });

    it('should return a 303 redirect', (done) => {
      const refParam = '/messages';
      const pushParam = { original: 'input' };
      const databaseStub = sinon.stub();
      const refStub = sinon.stub();
      const pushStub = sinon.stub();

      // The following lines override the behavior of admin.database().ref('/messages')
      // .push({ original: 'input' }) to return a promise that resolves with { ref: 'new_ref' }.
      // This mimics the behavior of a push to the database, which returns an object containing a
      // ref property representing the URL of the newly pushed item.

      Object.defineProperty(admin, 'database', { get: () => databaseStub });
      databaseStub.returns({ ref: refStub });
      refStub.withArgs(refParam).returns({ push: pushStub });
      pushStub.withArgs(pushParam).returns(Promise.resolve({ ref: 'new_ref' }));

      // [START assertHTTP]
      // A fake request object, with req.query.text set to 'input'
      const req = { query: {text: 'input'} };
      // A fake response object, with a stubbed redirect function which asserts that it is called
      // with parameters 303, 'new_ref'.
      const res = {
        redirect: (code, url) => {
          assert.equal(code, 303);
          assert.equal(url, 'new_ref');
          done();
        }
      };

      // Invoke addMessage with our fake request and response objects. This will cause the
      // assertions in the response object to be evaluated.
      myFunctions.addMessage(req, res);
      // [END assertHTTP]
    });
  });
})
