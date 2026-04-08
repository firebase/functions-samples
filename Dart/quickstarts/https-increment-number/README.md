# HTTPS Increment Number Quickstart

This quickstart demonstrates how to handle HTTP requests for Cloud Functions using Dart. 
It features two endpoints:
- `incrementLocal`: Simple POST request that takes a local count and returns it incremented by 1.
- `incrementSynced`: GET and POST endpoints that sync a counter variable to Firestore, returning the newly updated count.

## Prerequisites

1. Add your Firebase project to this Quickstart:
   ```bash
   firebase use --add
   ```
2. Enable Firestore in the Firebase Console and configure the emulator for local testing.

## Local Testing

First, fetch dependencies:
```bash
dart pub get
```

Then, you can use the Firebase CLI to test the function:
```bash
firebase emulators:start --only functions
```

Note: To test `incrementSynced`, ensure you also start the Firestore emulator: `firebase emulators:start --only functions,firestore`.

### Testing `incrementLocal`

In a separate terminal, use cURL to POST to the function (replace the URL with the one provided by the emulator):

```bash
curl -X POST http://127.0.0.1:5001/YOUR_PROJECT/us-central1/increment-local \
     -H "Content-Type: application/json" \
     -d '{"count": 5}'
```

You should see:
```json
{"message":"Local increment complete!","newCount":6}
```

### Testing `incrementSynced`

To test using Firestore, fetch the initial count:
```bash
curl -X GET http://127.0.0.1:5001/YOUR_PROJECT/us-central1/increment-synced
```

Then increment it using POST:
```bash
curl -X POST http://127.0.0.1:5001/YOUR_PROJECT/us-central1/increment-synced \
     -H "Content-Type: application/json"
```
