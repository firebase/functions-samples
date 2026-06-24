// @ts-nocheck
// Disable strict type-checking on this legacy JavaScript file against Admin SDK v14 modular definitions when evaluated under monorepo root tsc checkJs.
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

// Follow the instructions in uppercase/README.md for running these tests.
// Visit https://firebase.google.com/docs/functions/unit-testing to learn more
// about using the `firebase-functions-test` SDK.

jest.mock("jose", () => ({}));
jest.mock("jwks-rsa", () => ({}));

const admin = require('firebase-admin');
// Require and initialize firebase-functions-test in "online mode" with your project's
// credentials and service account key.
const projectConfig = {
  projectId: 'my-project',
  databaseURL: 'https://my-project.firebaseio.com'
};
const test = require('firebase-functions-test')(projectConfig, './service-account-key.json');

describe('Cloud Functions', () => {
  let myFunctions;

  beforeAll(() => {
    // Require index.js and save the exports inside a namespace called myFunctions.
    // This includes our cloud functions, which can now be accessed at myFunctions.makeUppercase
    // and myFunctions.addMessage
    myFunctions = require('../index');
  });

  afterAll(() => {
    // Do cleanup tasks.
  afterAll(async () => {
    await admin.database().ref('messages').remove();
    test.cleanup();
  });

  describe('makeUpperCase', () => {
    // Test Case: setting messages/11111/original to 'input' should cause 'INPUT' to be written to
    // messages/11111/uppercase
    it('should upper case input and write it to /uppercase', () => {
      // [START assertOnline]
      // Create a DataSnapshot with the value 'input' and the reference path 'messages/11111/original'.
      const snap = test.database.makeDataSnapshot('input', 'messages/11111/original');
      // Wrap the makeUppercase function
      const wrapped = test.wrap(myFunctions.makeUppercase);
      // Call the wrapped function with the snapshot you constructed.
      return wrapped(snap).then(() => {
        // Read the value of the data at messages/11111/uppercase. Because `admin.initializeApp()` is
        // called in functions/index.js, there's already a Firebase app initialized.
        return admin.database().ref('messages/11111/uppercase').once('value').then((createdSnap) => {
          // Assert that the value is the uppercased version of our input.
          expect(createdSnap.val()).toBe('INPUT');
        });
      });
      // [END assertOnline]
    });
  });

  describe('addMessage', () => {
    it('should return a 303 redirect', (done) => {
      // A fake request object, with req.query.text set to 'input'
      const req = { query: {text: 'input'} };
      // A fake response object, with a stubbed redirect function which does some assertions
      const res = {
        redirect: (code, url) => {
          // Assert code is 303
          expect(code).toBe(303);
          // If the database push is successful, then the URL sent back will have the following format:
          const expectedRef = new RegExp(projectConfig.databaseURL + '/messages/');
          expect(expectedRef.test(url)).toBe(true);
          done();
        }
      };

      // Invoke addMessage with our fake request and response objects. This will cause the
      // assertions in the response object to be evaluated.
      myFunctions.addMessage(req, res);
    });
  });
});
