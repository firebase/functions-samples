const functions = require('firebase-functions');

exports.getAutocompleteResponse = functions
  .runWith(
    // Keep 50 instances hot for this latency-critical function
    {
      minInstances: 50,
    }
  )
  .https.onCall((data, context) => {
    // Autocomplete a user's search term
  });

exports.mirrorOrdersToLegacyDatabase = functions
  .runWith(
    // Legacy database only supports 100 simultaneous connections
    { maxInstances: 100 }
  )
  .firestore.document('orders/{orderId}')
  .onWrite((change, context) => {
    // Connect to legacy database
  });

exports.convertLargeFile = functions
  .runWith(
    // These options ensure the function has enough memory and time
    // to process large files
    {
      timeoutSeconds: 300,
      memory: '1GB',
    }
  )
  .storage.object()
  .onFinalize((object) => {
    // Do some complicated things that take a lot of memory and time
  });
