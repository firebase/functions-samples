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

 1. Create a Firebase project on the [Firebase Console](https://console.firebase.google.com).
 1. In the Google Cloud Console [enable the **Google Cloud Vision API**](https://console.cloud.google.com/apis/api/vision.googleapis.com/overview?project=_). Note: Billing is required to enable the Cloud Vision API so enable Billing on your Firebase project by switching to the Blaze or Flame plans. For more information have a look at the [pricing page](https://firebase.google.com/pricing/).
 1. Clone or download this repo and open the `moderate-image` directory.
 1. You must have the Firebase CLI installed. If you don't have it install it with `npm install -g firebase-tools` and then configure it with `firebase login`.
 1. Configure the CLI locally by using `firebase use --add` and select your project in the list.
 1. Install dependencies locally by running: `cd functions; npm install; cd -`

## Deploy and test

To test the sample:

1. Deploy your Cloud Functions using `firebase deploy`
1. Go to the Firebase Console **Storage** tab and upload an image that contains adult or violent content. After a short time, refresh the page. You'll see a new folder that contains a blurred version of your uploaded image.
