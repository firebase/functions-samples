# Automatically Moderate Images

This sample demonstrates how to automatically moderate offensive images uploaded to Firebase Storage. It uses The Google Cloud Vision API to detect if the image contains adult or violent content and if so uses ImageMagick to blur the image.


## Functions Code

See file [functions/index.js](functions/index.js) for the moderation code.

The detection of adult and violent content in an image is done using The [Google Cloud Vision API](https://cloud.google.com/vision/).
The image blurring is performed using ImageMagick which is installed by default on all Cloud Functions instances. The image is first downloaded locally from the Firebase Storage bucket to the `tmp` folder using the [google-cloud](https://github.com/GoogleCloudPlatform/google-cloud-node) SDK.

The dependencies are listed in [functions/package.json](functions/package.json).


## Trigger rules

The function triggers on upload of any file to your Firebase project's default Cloud Storage bucket.


## Setting up the sample

Create a Firebase project on the [Firebase Console](https://console.firebase.google.com).
Enable Billing on your project by switching to the Blaze or Candle plan then visit the **Storage** tab.

Replace the placeholder `FIREBASE_STORAGE_BUCKET_NAME` with the name of the Firebase Storage bucket which can be found in the **Storage** tab of your Firebase project's console. It is typically of the form `<project-id>.appspot.com`.

In your [Google Cloud Console](https://console.cloud.google.com/apis/api/vision.googleapis.com/overview?project=_) enable the **Google Cloud Vision API**.


## Deploy and test

To test the sample:

 - Deploy your project using `firebase deploy`
 - Go to the Firebase Console **Storage** tab and upload an image that contains adult or violent content. After a short time the image will be replaced by a blurred version of itself.
