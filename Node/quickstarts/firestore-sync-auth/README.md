# Firebase SDK for Cloud Functions Quickstart - Firestore with auth context

This quickstart demonstrates using the **Firebase SDK for Cloud Functions** with
**Firestore** with authentication context.

## Introduction

This sample app adds auth metadata to all documents written to a collection.

## Set up the sample

Before you can test the functions locally or deploy to a Firebase project,
you'll need to run `npm install` in the `functions` directory.

## Run locally with the Firebase Emulator suite

The
[Firebase Local Emulator Suite](https://firebase.google.com/docs/emulator-suite)
allows you to build and test apps on your local machine instead of deploying to
a Firebase project.

1. Create a Firebase project in the
   [Firebase Console](https://console.firebase.google.com)
   > _Wondering why this step is needed?_ Even though the emulator will run this
   > sample on your local machine, it needs to interact with a Firebase project
   > to retrieve some configuration values.
1. [Set up or update the Firebase CLI](https://firebase.google.com/docs/cli#setup_update_cli)
1. Run `firebase emulators:start`
1. Open the Emulator Suite UI
   1. Look in the output of the `firebase emulators:start` command for the URL
      of the Emulator Suite UI. It defaults to
      [localhost:4000](http://localhost:4000), but may be hosted on a different
      port on your machine.
   1. Enter that URL in your browser to open the UI.
1. Trigger the functions
   1. Look in the output of the `firebase emulators:start` command for the URL
      of the http function "verifyComment". It will look similar to:
      `http://localhost:5001/MY_PROJECT/us-central1/verifyComment`
      1. `MY_PROJECT` will be replaced with your project ID
      1. The port may be different on your local machine
   1. Create a new document in the `comments` collection in Firestore in the emulator UI.
1. View the effects of the functions in the Emulator Suite UI

   1. In the "Logs" tab, you should see new logs indicating that the functions
      "verifyComment" and "makeuppercase" ran:

      > `functions: Beginning execution of "verifyComment"`

   1. In the "Firestore" tab, you should see the document containing your original
      message updated to include auth context.

## Deploy and test on a live Firebase project

To deploy and test the sample:

1. Create a Firebase project on the
   [Firebase Console](https://console.firebase.google.com)
1. Deploy your project's code using `firebase deploy`
1. Create a new document in the `comments` collection in Firestore in the Firebase console.

You should see the document containing your original message updated to include auth context.

## Contributing

We'd love that you contribute to the project. Before doing so please read our
[Contributor guide](../../CONTRIBUTING.md).

## License

© Google, 2023. Licensed under an [Apache-2](../../LICENSE) license.
