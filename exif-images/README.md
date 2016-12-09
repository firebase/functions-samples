# Automatically Extract Images Metadata

This sample demonstrates how to automatically extract images metadata that are uploaded to Firebase Storage ImageMagick.


## Functions Code

See file [functions/index.js](functions/index.js) for the email sending code.

The image metadata is provided using ImagMagick `identify` tool which is installed by default on all Firebase Functions. This is a CLI for which we use a NodeJS wrapper. The image is first downloaded locally from the Firebase Storage bucket to the `tmp` folder using the [google-cloud](https://github.com/GoogleCloudPlatform/google-cloud-node) SDK.

The dependencies are listed in [functions/package.json](functions/package.json).


## Trigger rules

The function triggers on upload of any file to the Firebase Functions bucket.


## Storage and Database Structure

Users Upload an image to Firebase Storage to the path `/<timestamp>/<filename>` and in return the Function will write to the `/<timestamp>/<filename>` path in the database. The filename typically contains illegal characters for a Firebase Realtime Database keys (such as `.`) so we're replacing all these by the `*` character.

For example the metadata for the file at path `/1477402116302/mypic.jpg` will be written to the corresponding Database path `/1477402116302/mypic*jpg`


## Setting up the sample

This sample comes with a Function and  web-based UI for testing the function. To configure it:

 - Create a Firebase project on the [Firebase Console](https://console.firebase.google.com)
 - Enable Anonymous sign in the Auth section
 - Import and configure Firebase in the `index.html` where the `TODO` is located


## Deploy and test

To test the sample:

 - Deploy your project using `firebase deploy`
 - Open the Deploy Web UI using `firebase open`, typically at the URL `https://<projectID>.firebaseapp.com`
 - Upload an image using the Web UI.
 - You should see the metadata displayed below after a bit.
