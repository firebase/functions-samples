import {logger} from "firebase-functions";
import {onObjectFinalized} from "firebase-functions/v2/storage";

export const logstore = onObjectFinalized("my-bucket", (cloudEvent) => {
  logger.log(cloudEvent);
});
