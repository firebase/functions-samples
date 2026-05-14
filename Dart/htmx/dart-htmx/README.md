# Firebase SDK for Cloud Functions Sample - HTMX & Pico CSS

This sample demonstrates using the **Firebase SDK for Cloud Functions** with Dart, HTMX, and Pico CSS to build a dynamic click-to-edit web application powered by Firestore.

## Introduction

The `contact` function serves an HTML page with a contact card. Using HTMX, clicking "Click To Edit" fetches an edit form and swaps it into the page without a full reload. Submitting the form updates the contact in Firestore and swaps the updated display card back into the page.

Further reading:
 - [Read more about Cloud Functions for Firebase](https://firebase.google.com/docs/functions)
 - [HTMX Documentation](https://htmx.org/docs/)
 - [Pico CSS Documentation](https://picocss.com/docs)

## Initial setup, build tools and dependencies

### 1. Clone this repo

Clone or download this repo and open the `Dart/htmx/dart-htmx` directory.

### 2. Create a Firebase project and configure the sample

Create a Firebase Project on the [Firebase Console](https://console.firebase.google.com).

Set up your Firebase project by running `firebase use --add`, select your Project ID and follow the instructions.

### 3. Install the Firebase CLI

You need to have installed the Firebase CLI. If you haven't, run:

```bash
npm install -g firebase-tools
```

## Deploy the app

First you need to get the `dart` dependencies of the functions:

```bash
dart pub get
```

Deploy to Firebase using the following command:

```bash
firebase deploy
```

Alternatively, you can call `firebase emulators:start` to test the functions on the local emulator suite.

## Try the sample

After deploying the function, check the CLI's output to see the URL for your function.

Open the URL in a browser to view the contact card, click "Click To Edit", modify the details, and click "Save" to see HTMX and Firestore in action.

## Contributing

We'd love that you contribute to the project. Before doing so please read our [Contributor guide](../../CONTRIBUTING.md).

## License

© Google, 2026. Licensed under an [Apache-2](../../../LICENSE) license.
