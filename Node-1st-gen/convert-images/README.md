# Automatically Convert Images

This sample demonstrates how to automatically convert images that are uploaded to Firebase Storage to JPEG using ImageMagick.


## Functions Code

See file [functions/index.js](functions/index.js) for the image conversion code.

The image conversion is performed using ImagMagick which is installed by default on all Cloud Functions instances. This is a CLI so we execute the command from node using the [child-process-promise](https://www.npmjs.com/package/child-process-promise) package. The image is first downloaded locally from the Firebase Storage bucket to the `tmp` folder using the [google-cloud](https://github.com/GoogleCloudPlatform/google-cloud-node) SDK.

The dependencies are listed in [functions/package.json](functions/package.json).


## Trigger rules

The function triggers on upload of any file to your Firebase project's default Cloud Storage bucket.


## Deploy and test

To deploy and test the sample:

 - Create a Firebase project on the [Firebase Console](https://console.firebase.google.com) and visit the **Storage** tab.
 - Deploy your project using `firebase deploy`
 - Go to the Firebase Console **Storage** tab and upload an image that is not a JPEG, for instance a PNG. After a short time an image with the same base name but the `.jpg` extension will be created in the same folder (make sure you refresh the UI to see the new file).
