const functions = require("firebase-functions");

// [START runtimeMinInstances]
exports.getAutocompleteResponse = functions
    .runWith({
      // Keep 5 instances warm for this latency-critical function
      minInstances: 5,
    })
    .https.onCall((data, context) => {
      // Autocomplete a user's search term
    });
// [END runtimeMinInstances]

// [START runtimeMinInstancesDynamic]
// Get Firebase project id from `FIREBASE_CONFIG` environment variable
const envProjectId = JSON.parse(process.env.FIREBASE_CONFIG).projectId;

exports.renderProfilePage = functions
    .runWith({
      // Keep 5 instances warm for this latency-critical function
      // in production only. Default to 0 for test projects.
      minInstances: envProjectId === "my-production-project" ? 5 : 0,
    })
    .https.onRequest((req, res) => {
      // render some html
    });
// [END runtimeMinInstancesDynamic]

// [START runtimeMaxInstances]
exports.mirrorOrdersToLegacyDatabase = functions
    .runWith({
      // Legacy database only supports 100 simultaneous connections
      maxInstances: 100,
    })
    .firestore.document("orders/{orderId}")
    .onWrite((change, context) => {
      // Connect to legacy database
    });
// [END runtimeMaxInstances]

// [START runtimeTimeoutMemory]
exports.convertLargeFile = functions
    .runWith({
      // Ensure the function has enough memory and time
      // to process large files
      timeoutSeconds: 300,
      memory: "1GB",
    })
    .storage.object()
    .onFinalize((object) => {
      // Do some complicated things that take a lot of memory and time
    });
// [END runtimeTimeoutMemory]
