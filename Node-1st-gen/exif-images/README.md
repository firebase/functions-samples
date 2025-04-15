# Automatically Extract Images Metadata

This sample demonstrates how to automatically extract images metadata that are uploaded to Firebase Storage ImageMagick.

## Functions Code

See file [functions/index.js](functions/index.js) for the code.

The image metadata is provided using ImagMagick `identify` tool which is installed by default on all Cloud Functions instances. This is a CLI for which we use a NodeJS wrapper. The image is first downloaded locally from the Firebase Storage bucket to the `tmp` folder using the [google-cloud](https://github.com/GoogleCloudPlatform/google-cloud-node) SDK.

The dependencies are listed in [functions/package.json](functions/package.json).

## Trigger rules

The function triggers on upload of any file to your Firebase project default Cloud Storage bucket.

## Storage and Database Structure

Users upload an image to Firebase Storage to the path `/<timestamp>/<filename>` and in return the Function will write to the `/<timestamp>/<filename>` path in the database. The filename typically contains illegal characters for a Firebase Realtime Database keys (such as `.`) so we're replacing all these by the `*` character.

For example the metadata for the file at path `/1477402116302/mypic.jpg` will be written to the corresponding Database path `/1477402116302/mypic*jpg`

## Setting up the sample

This sample comes with a Function and web-based UI for testing the function. To configure it:

1.  Create a Firebase Project using the [Firebase Console](https://console.firebase.google.com).
1.  Enable the **Anonymous** sign-in in the **Auth** section.
1.  Clone or download this repo and open the `exif-image` directory.
1.  You must have the Firebase CLI installed. If you don't have it install it with `npm install -g firebase-tools` and then configure it with `firebase login`.
1.  Configure the CLI locally by using `firebase use --add` and select your project in the list.
1.  Install dependencies locally by running: `cd functions; npm install; cd -`

## Deploy and test

To test the sample:

1.  Deploy your project using `firebase deploy`
1.  Open the app using `firebase open hosting:site`, this will open a browser.
1.  Upload an image using the Web UI.
1.  You should see the metadata displayed below after a bit.
