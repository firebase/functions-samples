# Firebase SDK for Cloud Functions Quickstart - Firestore

This quickstart demonstrates using the **Firebase SDK for Cloud Functions** with
**Firestore**.

## Introduction

This sample app does two things:

- Creates messages in Firestore using a simple HTTPS request which is
  handled by an HTTP function. Writing to Firestore is done using the
  Firebase Admin SDK.
- When a message gets added in Firestore, a function triggers and
  automatically makes these messages all uppercase.

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
      of the http function "addmessage". It will look similar to:
      `http://localhost:5001/MY_PROJECT/us-central1/addmessage`
      1. `MY_PROJECT` will be replaced with your project ID
      1. The port may be different on your local machine
   1. Add the query string `?text=uppercaseme` to the end of the function's URL.
      It should now look something like:
      `http://localhost:5001/MY_PROJECT/us-central1/addmessage?text=uppercaseme`
      1. Optionally, you can change the message "uppercaseme" to a custom
         message
   1. Create a new message by opening the URL in a new tab in your browser
1. View the effects of the functions in the Emulator Suite UI

   1. In the "Logs" tab, you should see new logs indicating that the functions
      "addmessage" and "makeuppercase" ran:

      > `functions: Beginning execution of "addmessage"`

      > `functions: Beginning execution of "makeuppercase"`

   1. In the "Firestore" tab, you should see a document containing your original
      message as well as the uppercased version of your message (if it was
      originally "uppercaseme", you'll see "UPPERCASEME")

## Deploy and test on a live Firebase project

To deploy and test the sample:

1. Create a Firebase project on the
   [Firebase Console](https://console.firebase.google.com)
1. Deploy your project's code using `firebase deploy`
1. Create a message by opening the function URL in your browser.

You should see your text value displayed in the console and uppercase.

## Contributing

We'd love that you contribute to the project. Before doing so please read our
[Contributor guide](../../CONTRIBUTING.md).

## License

© Google, 2023. Licensed under an [Apache-2](../../LICENSE) license.
