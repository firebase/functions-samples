# Automatically Generate Thumbnails

This sample demonstrates how to automatically generate thumbnails for each images that are uploaded to Firebase Storage.


## Functions Code

See file [functions/index.js](functions/index.js) for the thumbnail generation code.

The thumbnail generation is performed using ImageMagick which is installed by default on all Cloud Functions instances. This is a CLI so we execute the command from node using the [child-process-promise](https://www.npmjs.com/package/child-process-promise) package. The image is first downloaded locally from the Firebase Storage bucket to the `tmp` folder using the [google-cloud](https://github.com/GoogleCloudPlatform/google-cloud-node) SDK.

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
 - Deploy your project using `firebase deploy`
 - Go to your project's [**Cloud Console > IAM & admin > IAM**](https://console.cloud.google.com/iam-admin/iam?project=_), Find the **App Engine default service account** and add the **Service Account Token Creator** role to that member. This will allow your app to create signed public URLs to the images.
 - Go to the Firebase Console **Storage** tab and upload an image. After a short time an thumbnail image with the same name but a `thumb_` prefix will be created in the same folder (make sure you refresh the UI to see the new file).
 - Go to the Firebase Console **Database** tab and see that a child of `images` has been created containing the Signed URLs for both images.
