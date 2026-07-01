// @ts-nocheck
// Disable strict type-checking on this legacy JavaScript file against Admin SDK v14 modular definitions when evaluated under monorepo root tsc checkJs.
jest.mock("jose", () => ({}));
jest.mock("jwks-rsa", () => ({}));

const {logger} = require("firebase-functions");
const test = require('firebase-functions-test')();
const admin = require('firebase-admin');

describe('Cloud Functions', () => {
  let myFunctions, adminInitStub;

  beforeAll(() => {
    // [START stubAdminInit]
    // If initializeApp() is called in index.js, we mock it out before requiring index.js
    adminInitStub = jest.spyOn(admin, 'initializeApp').mockImplementation(() => {});
    // Now we can require index.js and save the exports inside a namespace called myFunctions.
    myFunctions = require('../index');
    // [END stubAdminInit]
  });

  afterAll(() => {
    // Restore admin.initializeApp() to its original method.
    adminInitStub.mockRestore();
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
      // Spies/mocks are objects that fake and/or record function calls.
      // These are excellent for verifying that functions have been called and to validate the
      // parameters passed to those functions.
      const setStub = jest.fn().mockImplementation((val) => val === setParam ? true : undefined);
      const childStub = jest.fn().mockImplementation((path) => path === childParam ? { set: setStub } : undefined);
      // [START fakeSnap]
      // The following lines create a fake snapshot, 'snap', which returns 'input' when snap.val() is called,
      // and returns true when snap.ref.parent.child('uppercase').set('INPUT') is called.
      const snap = {
        val: () => 'input',
        ref: {
          parent: {
            child: childStub,
          }
        }
      };
      // [END fakeSnap]
      // Wrap the makeUppercase function.
      const wrapped = test.wrap(myFunctions.makeUppercase);
      // Since we've mocked snap.ref.parent.child(childParam).set(setParam) to return true if it was
      // called with the parameters we expect, we assert that it indeed returned true.
      return wrapped(snap).then(makeUppercaseResult => {
        expect(makeUppercaseResult).toBe(true);
      });
      // [END assertOffline]
    });
  });

  describe('addMessage', () => {
    let oldDatabase;
    beforeAll(() => {
      // Save the old database method so it can be restored after the test.
      oldDatabase = admin.database;
    });

    afterAll(() => {
      // Restoring admin.database() to the original method.
      admin.database = oldDatabase;
    });

    it('should return a 303 redirect', (done) => {
      const refParam = '/messages';
      const pushParam = { original: 'input' };
      
      const pushStub = jest.fn().mockImplementation((val) => val.original === pushParam.original ? Promise.resolve({ ref: 'new_ref' }) : undefined);
      const refStub = jest.fn().mockImplementation((path) => path === refParam ? { push: pushStub } : undefined);

      // The following line overrides the behavior of admin.database().ref('/messages')
      // .push({ original: 'input' }) to return a promise that resolves with { ref: 'new_ref' }.
      admin.database = jest.fn().mockReturnValue({ ref: refStub });

      // [START assertHTTP]
      // A fake request object, with req.query.text set to 'input'
      const req = { query: {text: 'input'} };
      // A fake response object, with a stubbed redirect function which asserts that it is called
      // with parameters 303, 'new_ref'.
      const res = {
        redirect: (code, url) => {
          expect(code).toBe(303);
          expect(url).toBe('new_ref');
          done();
        }
      };

      // Invoke addMessage with our fake request and response objects. This will cause the
      // assertions in the response object to be evaluated.
      myFunctions.addMessage(req, res);
      // [END assertHTTP]
    });
  });
});
