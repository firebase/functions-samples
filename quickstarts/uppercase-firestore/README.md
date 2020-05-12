# Firebase SDK for Cloud Functions Quickstart - Cloud Firestore

This quickstart demonstrates using **Firebase SDK for Cloud Functions** setup
with a **Cloud Firestore**.

## Introduction

This sample app does two things:

- Create messages in Cloud Firestore using a simple HTTPS request which is
  handled by an HTTP function. Writing to Cloud Firestore is done using the
  Firebase Admin SDK.ß
- When a message gets added in the Cloud Firestore, a function triggers and
  automatically makes these messages all uppercase.

1. Create a Firebase project on the
   [Firebase Console](https://console.firebase.google.com)
   1. The emulator needs to associate with a Firebase project to retrieve some
      configuration values, but will run this sample completely on your local
      machine.
1. Set up or update the
   [Firebase CLI](https://firebase.google.com/docs/cli#setup_update_cli)
1. Run `firebase emulators:start`
1. Look in the logs of the output for the url of the emulator GUI. It is
   defaults to [localhost:4000](http://localhost:4000), but may be hosted on a
   different port on your machine. Enter that URL in your browser to open the
   UI.
1. Create a new message by opening the following URL in a new tab in your
   browser:
   `http://localhost:5001/MY_PROJECT/us-central1/addMessage?text=uppercaseme`
   1. Replace `MY_PROJECT` with your project ID
   1. Optionally, you can change the message "uppercaseme" to a custom message
1. View the effects of the functions
   1. In the "Logs" tab of the emulator GUI, you should see new logs indicating
      that the functions "addMessage" and "makeUppercase" ran with the logs
      `functions: Beginning execution of "addMessage"` and
      `functions: Beginning execution of "makeUppercase"`
   1. In the "Firestore" tab, you should see a document containing your original
      message as well as the uppercased version of your message (if it was
      originally "uppercaseme", you'll see "UPPERCASEME")

## Deploy and test on a live Firebase project

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
