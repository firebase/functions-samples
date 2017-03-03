# Firebase SDK for Cloud Functions Quickstart - Realtime Database

This quickstart demonstrates using **Firebase SDK for Cloud Functions** setup with a **Firebase database**.


## Introduction

This sample app does two things:
 - Create messages in the Firebase Realtime Database using a simple HTTPS request which is handled by an HTTPS Firebase Function
 - When a message gets added in the Realtime Database, a Firebase Function triggers and automatically makes these messages all uppercase.

## Deploy and test

To deploy and test the sample:

 - Create a Firebase project on the [Firebase Console](https://console.firebase.google.com)
 - Install the required dependencies by running `npm install` in the `functions` directory
 - Deploy your project's code using `firebase deploy`
 - Create a message by opening the following URL in your browser: https://us-central1-[MY_PROJECT].cloudfunctions.net/addMessage?text=uppercaseme (Replace [MY_PROJECT] by your project ID and you can change the message "uppercaseme").

 The function executes and redirects the browser to the Firebase console at the database location where the text string was stored. You should see your text value displayed in the console and uppercase.




## Contributing

We'd love that you contribute to the project. Before doing so please read our [Contributor guide](../../CONTRIBUTING.md).


## License

© Google, 2016. Licensed under an [Apache-2](../../LICENSE) license.
