import * as functions from "firebase-functions";

export const helloTS = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from TS codebase!");
});
