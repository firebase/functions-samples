# Automatically convert audio files using ffmpeg

This sample uses ffmpeg / fluent-ffmpeg and automatically converts audio files that are uploaded to Cloud Storage to FLAC file format with mono-channel audio @ 16000hz.

## Functions Code

See file [functions/index.js](functions/index.js) for the audio conversion code.

The audio conversion is performed using ffmpeg. The audio is first downloaded locally from the Cloud Storage bucket to the `tmp` folder using the [google-cloud](https://github.com/GoogleCloudPlatform/google-cloud-node) SDK.

The dependencies are listed in [functions/package.json](functions/package.json).

## Trigger rules

The function triggers on upload of any file to your Firebase project's default Cloud Storage bucket.

## Deploy and test

To deploy and test the sample:

- Create a Firebase project on the [Firebase Console](https://console.firebase.google.com) and visit the **Storage** tab.
- Get the code, for instance using `git clone https://github.com/firebase/functions-samples`
- Enter the correct directory `cd functions-samples/ffmpeg-convert-audio`
- Set up the CLI to use your Firebase project using `firebase use --add` and select your Firebase project
- Deploy your project's code using `firebase deploy`
- Go to the Firebase Console **Storage** tab and upload an audio. After a short time a converted audio with the same name but a `_output.flac` suffix will be created in the same folder (make sure you refresh the UI to see the new file).

## Notes

- Take into account that the audio files produced should not exceed the size of the memory of your function.
- The audio conversion could take a certain amount of time, increase the timeout of your function using the cloud functions webgui so the function can run for a longer time.
