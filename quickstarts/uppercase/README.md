# Firebase SDK for Cloud Functions Quickstart - Realtime Database

This quickstart demonstrates using **Firebase SDK for Cloud Functions** setup with a **Firebase database**.


## Introduction

This sample app does two things:
 - Create messages in the Firebase Realtime Database using a simple HTTPS request which is handled by an HTTPS Firebase Function. Writing to the Realtime Database is done using the Firebase Admin SDK. 
 - When a message gets added in the Realtime Database, a Firebase Function triggers and automatically makes these messages all uppercase.

## Deploy and try out

To deploy and try out the sample:

 - Create a Firebase project on the [Firebase Console](https://console.firebase.google.com)
 - Install the required dependencies by running `npm install` in the `functions` directory
 - Deploy your project's code using `firebase deploy`
 - Create a message by opening the following URL in your browser: https://us-central1-[MY_PROJECT].cloudfunctions.net/addMessage?text=uppercaseme (Replace [MY_PROJECT] by your project ID and you can change the message "uppercaseme").

 The function executes and redirects the browser to the Firebase console at the database location where the text string was stored. You should see your text value displayed in the console and uppercase.

## Run unit tests

The test folder has unit tests written with `firebase-functions-test`. There are 2 sets of tests: online and offline.

To run the offline tests: run `npm test` inside the functions folder.

To run the online tests:
 - Replace the `projectConfig` variable in `test/test.online.js` with configuration values from your project.
 - Download a service account key by following these instructions:
 ..* Open the Service Accounts pane of the Google Cloud Console.
 ..* Select the App Engine default service account, and use the options menu at right to select Create key.
 ..* When prompted, select JSON for the key type, and click Create.
 - Save the file in the test folder, and name it `service-account-key.json`
 - Run `npm run test-online` inside the functions folder.

## Contributing

We'd love that you contribute to the project. Before doing so please read our [Contributor guide](../../CONTRIBUTING.md).


## License

© Google, 2016. Licensed under an [Apache-2](../../LICENSE) license.
