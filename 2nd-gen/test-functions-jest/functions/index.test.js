const {logger} = require("firebase-functions");
const test = require("firebase-functions-test");
const {logstore} = require("./index");

const {wrap} = test();

describe("firebase-functions-test", () => {
  describe("#logstore", () => {
    it("will log when the v2 cloud function is invoked", () => {
      const logSpy = jest.spyOn(logger, "log");

      const wrappedFunction = wrap(logstore);
      wrappedFunction();
      expect(logSpy).toHaveBeenCalled();
    });
  });
});
