# Automatically Generate Thumbnails

This sample demonstrates how to automatically generate thumbnails for each images that are uploaded to Firebase Storage.


## Functions Code

See file [functions/index.js](functions/index.js) for the thumbnail generation code.

The thumbnail generation is performed using ImageMagick which is installed by default on all Cloud Functions instances. This is a CLI so we execute the command from node using the [child-process-promise](https://www.npmjs.com/package/child-process-promise) package. The image is first downloaded locally from the Firebase Storage bucket to the `tmp` folder using the [google-cloud](https://github.com/GoogleCloudPlatform/google-cloud-node) SDK.

In order to generate a [Signed URL](https://cloud.google.com/storage/docs/access-control/signed-urls), a [Service Account Key](https://cloud.google.com/iam/docs/service-accounts?hl=en_US&_ga=1.107760523.860148169.149738105) is required. A Signed URL grants public read or write access to the URL for a specified limited time.

The dependencies are listed in [functions/package.json](functions/package.json).


## Trigger rules

The function triggers on upload of any file to your Firebase project's default Cloud Storage bucket.


## Deploy and test

To deploy and test the sample:

 - Create a Firebase project on the [Firebase Console](https://console.firebase.google.com) and visit the **Storage** tab.
 - Clone this repo: `git clone https://github.com/firebase/functions-samples`.
 - Open this sample's directory: `cd functions-samples/generate-thumbnail`
 - Setup your project by running `firebase use --add` and select the project you had created.
 - Install dependencies in the functions directory: `cd functions; npm install; cd -`
 - Go to the Firebase Console, select the gear image > **project settings** > **Service Accounts** and click **Generate New Private Key** to download a Service Account Key JSON document.
 - Add the JSON service account credentials file to the **Functions** directory as **functions/service-account-credentials.json**.
 - Deploy your project using `firebase deploy`
 - Go to the Firebase Console **Storage** tab and upload an image. After a short time an thumbnail image with the same name but a `thumb_` prefix will be created in the same folder (make sure you refresh the UI to see the new file).
 - Go to the Firebase Console **Database** tab and see that a child of `images` has been created containing the Signed URLs for both images.
