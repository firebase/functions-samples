# Firebase SDK for Cloud Functions Quickstart - Cloud Firestore

This quickstart demonstrates using **Firebase SDK for Cloud Functions** setup
with a **Cloud Firestore**.

## Introduction

This sample app does two things:

- Create messages in Cloud Firestore using a simple HTTPS request which is
  handled by an HTTP function. Writing to Cloud Firestore is done using the
  Firebase Admin SDK.
- When a message gets added in the Cloud Firestore, a function triggers and
  automatically makes these messages all uppercase.

## Deploy and test

To deploy and test the sample:

1. Create a Firebase project on the
   [Firebase Console](https://console.firebase.google.com)
1. Install the required dependencies by running `npm install` in the `functions`
   directory
1. Deploy your project's code using `firebase deploy`
1. Create a message by opening the following URL in your browser:
   https://us-central1-[MY_PROJECT].cloudfunctions.net/addMessage?text=uppercaseme
   (Replace [MY_PROJECT] by your project ID and you can change the message
   "uppercaseme").

You should see your text value displayed in the console and uppercase.

## Contributing

We'd love that you contribute to the project. Before doing so please read our
[Contributor guide](../../CONTRIBUTING.md).

## License

© Google, 2016. Licensed under an [Apache-2](../../LICENSE) license.
