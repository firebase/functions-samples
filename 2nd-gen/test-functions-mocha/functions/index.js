const {logger} = require("firebase-functions");
const {onObjectFinalized} = require("firebase-functions/v2/storage");

exports.logstore = onObjectFinalized("my-bucket", (cloudEvent) => {
  logger.log(cloudEvent);
});
