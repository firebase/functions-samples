# Firebase SDK for Cloud Functions Quickstart - Callable Functions

This quickstart demonstrates how to send requests to a server-side function and get a response back using one of the Client SDKs.

## Introduction

The function `addNumbers` Returns the sum of two numbers.

Further reading:

 - [Read more about Cloud Functions for Firebase](https://firebase.google.com/docs/functions/)

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
