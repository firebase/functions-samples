# Firebase SDK for Cloud Functions Quickstart - Callable Functions Streaming

This quickstart demonstrates how to send requests to a server-side function and _stream_ a response to a client SDK using Dart.

[Read more about Cloud Functions for Firebase](https://firebase.google.com/docs/functions/)


## Frontend Client

You can find the frontend code in [`../../../Node/quickstarts/callable-functions-streaming/website`](../../../Node/quickstarts/callable-functions-streaming/website).

**IMPORTANT NOTE**: Due to limitations during the experimental release of Dart support in Cloud Functions for Firebase, the code in the website must be modified. Instead of using `httpsCallable`, you must use [`httpsCallableFromURL`](https://firebase.google.com/docs/reference/js/functions.md#httpscallablefromurl_7af6987) and pass the full function url (`https://<function-name-and-hash>.run.app` or the emulator equivalent), which can be found in the Cloud console or the emulator logs.


## Deploy the app to prod

First you need to get the `dart` dependencies of the functions:

```bash
dart pub get
```

Deploy to Firebase using the following command:

```bash
firebase deploy --only functions
```

## License

© Google, 2026. Licensed under an [Apache-2](../../../LICENSE) license.
