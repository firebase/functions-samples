import {logger} from "firebase-functions";
import {storage} from "firebase-functions/v2";

export const logstore = storage.onObjectFinalized("my-bucket", (cloudEvent) => {
  logger.log(cloudEvent);
});
