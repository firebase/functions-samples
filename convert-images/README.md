# Automatically Convert Images

This sample demonstrates how to automatically convert images that are uploaded to Firebase Storage to JPEG using ImageMagick.


## Functions Code

See file [functions/index.js](functions/index.js) for the email sending code.

The image conversion is performed using ImagMagick which is installed by default on all Firebase Functions. This is a CLI for which we use a NodeJS wrapper. The image is first downloaded locally from the Firebase Storage bucket to the `tmp` folder using the [google-cloud](https://github.com/GoogleCloudPlatform/google-cloud-node) SDK.

The dependencies are listed in [functions/package.json](functions/package.json).


## Trigger rules

The function triggers on upload of any file to the Firebase Functions bucket.


## Setting up the sample

Create a Firebase project on the [Firebase Console](https://console.firebase.google.com) and visit the **Storage** tab.

Replace the placeholder `FIREBASE_STORAGE_BUCKET_NAME` with the name of the Firebase Storage bucket which can be found in the **Storage** tab of your Firebase project's console. It is typically of the form `<project-id>.appspot.com`.


## Deploy and test

To test the sample:

 - Deploy your project using `firebase deploy`
 - Go to the Firebase Console **Storage** tab and upload an image that is not a JPEG, for instance a PNG. After a short time an image with the same base name but the `.jpg` extension will be created in the same folder (make sure you refresh the UI to see the new file).
