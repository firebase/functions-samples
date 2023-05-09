/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const {logger} = require("firebase-functions");
const test = require("firebase-functions-test");
const {assert} = require("chai");
const {spy} = require("sinon");
const {logstore} = require("./index");

const {wrap} = test();

describe("firebase-functions-test", () => {
  describe("#logstore", () => {
    it("will log when the v2 cloud function is invoked", () => {
      const logSpy = spy(logger, "log");

      const wrappedFunction = wrap(logstore);
      wrappedFunction();
      assert.isTrue(logSpy.calledOnce);
    });
  });
});
