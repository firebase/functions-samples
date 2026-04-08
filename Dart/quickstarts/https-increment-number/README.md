# HTTPS Increment Number Quickstart

This quickstart demonstrates how to handle HTTP requests for Cloud Functions using Dart. 
It features two endpoints:
- `incrementLocal`: Simple POST request that takes a local count and returns it incremented by 1.
- `incrementSynced`: GET and POST endpoints that sync a counter variable to Firestore, returning the newly updated count.



## Local Testing

First, fetch dependencies:
```bash
dart pub get
```

Then, you can use the Firebase CLI to test the function locally. To ensure both endpoints work properly, make sure to start both the functions and firestore emulators:
```bash
firebase emulators:start --project="demo-example" --only firestore,functions
```

### Testing `incrementLocal`

In a separate terminal, use cURL to POST to the function (replace the URL with the one provided by the emulator):

```bash
curl -X POST http://127.0.0.1:5001/demo-example/us-central1/increment-local \
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
curl -X GET http://127.0.0.1:5001/demo-example/us-central1/increment-synced
```

Then increment it using POST:
```bash
curl -X POST http://127.0.0.1:5001/demo-example/us-central1/increment-synced \
     -H "Content-Type: application/json"
```
