# Automatically denoise and normalize audio with SoX
This sample uses a static SoX (Swiss Army knife of sound processing) executable and automatically remove background noise from audio and then normalize the audio volume to a certain level. The input is supposed to be voice recordings recorded with a smartphone.

## Functions Code

See file [functions/index.js](functions/index.js) for the audio conversion code.

The audio processing is performed using a static SoX executable. The audio is first downloaded locally from the Cloud Storage bucket to the `tmp` folder using the [google-cloud](https://github.com/GoogleCloudPlatform/google-cloud-node) SDK.

The dependencies are listed in [functions/package.json](functions/package.json).

## Trigger rules

The function triggers on upload of any file to your Firebase project's default Cloud Storage bucket.

## Deploy and test

To deploy and test the sample:

- Create a Firebase project on the [Firebase Console](https://console.firebase.google.com) and visit the **Storage** tab.
- Get the code, for instance using `git clone https://github.com/firebase/functions-samples`
- Enter the correct directory `cd functions-samples/sox-clean-audio`
- Setup the CLI to use your Firebase project using `firebase use --add` and select your Firebase project
- Deploy your project's code using `firebase deploy`
- Go to the Firebase Console **Storage** tab and upload an audio. After a short time a converted audio with the same name but a `d_` prefix for denoized audio files and `n_d_` prefix for denoized and normalized audio files will be created in the same folder (make sure you refresh the UI to see the new file).

## Notes
- The static SoX executable was built on Ubuntu 18.04.03 following [this instruction](https://marcelog.github.io/articles/static_sox_transcoding_lambda_mp3.html).