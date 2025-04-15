# Firebase SDK for Cloud Functions Quickstart - Auth Blocking Functions

================================================

The Auth Blocking functions Quickstart demonstrates how to block account sign in and creation when using Firebase Auth or Google Cloud Identity Platform in a Firebase App.

- [Read more about auth blocking functions](https://firebase.google.com/docs/auth/extend-with-blocking-functions)
- [Read more about Cloud Functions for Firebase](https://firebase.google.com/docs/functions/)

## Getting Started

To try this sample, you need a test app with Firebase Auth and Cloud Firestore enabled. Don't use a live app with real users!

1. Install dependencies with `npm install`
2. Deploy the functions with `firebase deploy --only functions`
3. Try to create an account using an email address with a domain _other than_ `@acme.com`. It should fail.
4. Add an existing user's email address to the `banned` collection in Cloud Firestore. Then, try to sign in as that user. It should fail.

## License

© Google, 2022. Licensed under an [Apache-2](../../../LICENSE) license.
