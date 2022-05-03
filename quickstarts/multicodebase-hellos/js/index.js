const functions = require("firebase-functions");

exports.helloJS = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from JS codebase!");
});
