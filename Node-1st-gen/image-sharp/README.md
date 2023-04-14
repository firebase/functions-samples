# Image resizing using Node.js Stream and Sharp - Cloud Storage trigger

This sample demonstrates how to use Node.js Stream to read image from Cloud Storage, generate a thumbnail image using Sharp and upload it back to Cloud Storage.
This is a alternative approach for using ImageMagick, see [generate-thumbnail](../generate-thumbnail).


## Functions Code

See file [functions/index.js](functions/index.js) for the thumbnail generation code.

The thumbnail generation is performed using [Sharp](https://sharp.pixelplumbing.com/en/stable/).
Download, resize input/output and upload uses Node.js [Stream](https://nodejs.org/api/stream.html) 

The dependencies are listed in [functions/package.json](functions/package.json).


## Trigger rules

The function triggers on upload of any file to your Firebase project's default Cloud Storage bucket.


## Deploy and test

To deploy and test the sample:

 1. Create a Firebase project on the [Firebase Console](https://console.firebase.google.com).
 1. Get the code, for instance using `git clone https://github.com/firebase/functions-samples`
 1. Enter the correct directory `cd functions-samples/image-sharp`
 1. If you do not have it yet, install the Firebase CLI `npm install -g firebase-tools`
 1. Setup the CLI to use your Firebase project using `firebase use --add` and select your Firebase project
 1. Deploy your project's code using `firebase deploy`
 1. Go to the Firebase Console **Storage** tab and upload an image. After a short time a thumbnail image with the same name but a `thumb_` prefix will be created in the same folder (make sure you refresh the UI to see the new file).


## Contributing

We'd love that you contribute to the project. Before doing so please read our [Contributor guide](../CONTRIBUTING.md).


## License

© Google, 2016. Licensed under an [Apache-2](../LICENSE) license.
