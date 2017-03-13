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


describe('Cloud Functions', () => {
  // [START stubConfig]
  var myFunctions, configStub, adminInitStub, functions, admin;

  before(() => {
    // Since index.js makes calls to functions.config and admin.initializeApp at the top of the file,
    // we need to stub both of these functions before requiring index.js. This is because the
    // functions will be executed as a part of the require process.
    // Here we stub admin.initializeApp to be a dummy function that doesn't do anything.
    admin =  require('firebase-admin');
    adminInitStub = sinon.stub(admin, 'initializeApp');
    // Next we stub functions.config(). Normally config values are loaded from Cloud Runtime Config;
    // here we'll just provide some fake values for firebase.databaseURL and firebase.storageBucket
    // so that an error is not thrown during admin.initializeApp's parameter check
    functions = require('firebase-functions');
    configStub = sinon.stub(functions, 'config').returns({
        firebase: {
          databaseURL: 'https://not-a-project.firebaseio.com',
          storageBucket: 'not-a-project.appspot.com',
        }
        // You can stub any other config values needed by your functions here, for example:
        // foo: 'bar'
      });
    // Now we can require index.js and save the exports inside a namespace called myFunctions.
    // This includes our cloud functions, which can now be accessed at myFunctions.makeUppercase
    // and myFunctions.addMessage
    myFunctions = require('../index');
  });

  after(() => {
    // Restoring our stubs to the original methods.
    configStub.restore();
    adminInitStub.restore();
  });
  // [END stubConfig]

  describe('makeUpperCase', () => {
    // Test Case: setting messages/11111/original to 'input' should cause 'INPUT' to be written to
    // messages/11111/uppercase
    it('should upper case input and write it to /uppercase', () => {

      // [START fakeEvent]
      const fakeEvent = {
        // The DeltaSnapshot constructor is used by the Functions SDK to transform a raw event from
        // your database into an object with utility functions such as .val().
        // Its signature is: DeltaSnapshot(app: firebase.app.App, adminApp: firebase.app.App,
        // data: any, delta: any, path?: string);
        // We can pass null for the first 2 parameters. The data parameter represents the state of
        // the database item before the event, while the delta parameter represents the change that
        // occured to cause the event to fire. The last parameter is the database path.
        data: new functions.database.DeltaSnapshot(null, null, null, 'input', 'messages/1111/original'),
        // To mock a database delete event:
        // data: new functions.database.DeltaSnapshot(null, null, 'old_data', null, 'messages/1111/original')
      };
      // [END fakeEvent]

      // [START stubDataRef]
      const childParam = 'uppercase';
      const setParam = 'INPUT';
      // Stubs are objects that fake and/or record function calls.
      // These are excellent for verifying that functions have been called and to validate the
      // parameters passed to those functions.
      const refStub = sinon.stub();
      const childStub = sinon.stub();
      const setStub = sinon.stub();
      // The following 4 lines override the behavior of event.data.ref.parent.child('uppercase')
      // .set('INPUT') to return true
      Object.defineProperty(fakeEvent.data, 'ref', { get: refStub });
      refStub.returns({ parent: { child: childStub}});
      childStub.withArgs(childParam).returns( { set: setStub });
      setStub.withArgs(setParam).returns(true);
      // [END stubDataRef]

      // [START verifyDataWrite]
      // All non-HTTPS cloud functions return a promise that resolves with the return value of your
      // code. In this case, we've stubbed it to return true if
      // event.data.ref.parent.child(childParam).set(setParam) was called with the parameters we
      // expect. We assert that makeUppercase returns a promise that eventually resolves with true.
      return assert.eventually.equal(myFunctions.makeUppercase(fakeEvent), true);
      // [END verifyDataWrite]
    })
  });

  describe('addMessage', () => {
    it('should return a 303 redirect', (done) => {

      // [START stubAdminDatabase]
      const refParam = '/messages';
      const pushParam = { original: 'input' };
      const refStub = sinon.stub();
      const pushStub = sinon.stub();

      // The following 4 lines override the behavior of admin.database().ref('/messages')
      // .push({ original: 'input' }) to return a promise that resolves with { ref: 'new_ref' }.
      // This mimics the behavior of a push to the database, which returns an object containing a
      // ref property representing the URL of the newly pushed item.
      databaseStub = sinon.stub(admin, 'database');
      databaseStub.returns( { ref: refStub });
      refStub.withArgs(refParam).returns( { push: pushStub });
      pushStub.withArgs(pushParam).returns( Promise.resolve({ ref: 'new_ref' }));
      // [END stubAdminDatabase]

      // [START invokeHTTPS]
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
      // [END invokeHTTPS]

      // Restoring admin.database() to the original method
      databaseStub.restore();
    });
  });
})