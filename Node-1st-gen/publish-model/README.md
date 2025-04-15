# Automatically Publish Models to Firebase ML

This sample demonstrates how to automatically publish models to Firebase ML for each TensorFlow Lite file that is uploaded to Firebase Storage.

## Functions Code

See file [functions/index.js](functions/index.js) for the model publishing code.

The dependencies are listed in [functions/package.json](functions/package.json).

## Trigger rules

The function triggers on upload of any file to your Firebase project's default Cloud Storage bucket.

## Deploy and test

To deploy and test the sample:

- Create a Firebase project on the [Firebase Console](https://console.firebase.google.com) and visit the **Storage** tab.
- Clone this repo: `git clone https://github.com/firebase/functions-samples`.
- Open this sample's directory: `cd functions-samples/publish-model`
- Setup your project by running `firebase use --add` and select the project you had created.
- Install dependencies in the functions directory: `cd functions; npm install; cd -`
- Deploy your project using `firebase deploy`
- Go to your project's [**Cloud Console > IAM & admin > IAM**](https://console.cloud.google.com/iam-admin/iam?project=_), Find the **App Engine default service account**.
- Add the **Service Account Token Creator** role to that member. This will allow your app to create signed public URLs to the models.
- Add the **Firebase ML Kit Admin** role to that member. This will allow your app to manage Firebase ML models.
- Add the **Firebase Admin SDK Administrator Service Agent** role to that member. This will allow your app to manage models with the Firebase Admin SDK.
- Go to the Firebase Console **Storage** tab and upload a Tensorflow Lite model (\*.tflite). After a short time a model with same file name will be published to Firebase ML.
- Go to the Firebase Console **ML Kit** (Custom) tab and see that a new model with file name has been created.
