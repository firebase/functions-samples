import {log} from "firebase-functions/lib/logger/index";
import {expect, jest, test} from "@jest/globals";
import {wrap} from "firebase-functions-test/lib/main";
import {logstore} from "../index";

test("logstore", () => {
  const mockLog = jest.fn(log);
  const wrappedLogStore = wrap(logstore);

  /**
   * Invoke the function once using default {@link CloudEvent}.
   */
  wrappedLogStore();
  expect(mockLog).toBeCalledTimes(1);

  /**
   * Invoke the function once using {@link Partial<CloudEvent>}.
   */
  const cloudEventPartial = {data: {bucket: "my-other-bucket"}};
  wrappedLogStore(cloudEventPartial);
  expect(mockLog).toBeCalledTimes(2);
});
