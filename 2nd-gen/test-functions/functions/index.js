const {logger} = require("firebase-functions");
const {storage} = require("firebase-functions/v2");

exports.logstore = storage.onObjectFinalized("my-bucket", (cloudEvent) => {
  logger.log(cloudEvent);
});
