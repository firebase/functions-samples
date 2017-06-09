# ES 2017 transpilation

This sample shows how you can write your Cloud Functions code using the ES2017 syntax - which is not supported natively by Cloud Functions. This requires to run a preparation step where your code is transpiled to a supported version of JavaScript.


## Functions Code

See file [functions/index.es7](functions/index.es7) for the code.

The function is a simple hello world sample that will write "Hello <Name>" as the value of any node created as `/hello/<name>` in the Firebase Realtime Database.

We're using some ES2017 syntax that is not supported natively by Cloud Functions such as async/await. The code will be transpiled to ES5 using the [BabelJS](https://babeljs.io/) CLI.

See the [functions/package.json](functions/package.json) file for the `prepare` script which runs the transpilation step.


## Deploy and test

This sample comes with a Function and web-based UI for testing the function. To configure it:

 1. Create a Firebase Project using the [Firebase Console](https://console.firebase.google.com).
 1. Clone or download this repo and open the `es2017-transpile` directory.
 1. You must have the Firebase CLI installed. If you don't have it install it with `npm install -g firebase-tools` and then configure it with `firebase login`.
 1. Configure the CLI locally by using `firebase use --add` and select your project in the list.
 1. Install dependencies locally by running: `cd functions; npm install; cd -`
 1. Transpile the code bu running: `cd functions; npm run prepare; cd -`
 1. Deploy your project using `firebase deploy`
 1. Open the Firebase console for your project
