# Firebase Functions Quickstart - HTTP

This quickstart demonstrates using **Firebase Functions** setup with an HTTP trigger.


## Introduction

The function `date` simply returns the current server date. You can pass it a `format` URL Query parameter to format the date.

Further reading:

 - [Read more about Firebase Functions](https://firebase.google.com/preview/functions/)


## Initial setup, build tools and dependencies

### 1. Clone this repo

Clone or download this repo and open the `http` directory.


### 2. Create a Firebase project and configure the quickstart

Create a Firebase Project on the [Firebase Console](https://console.firebase.google.com).

Set up your Firebase project by running `firebase use --add`, select your Project ID and follow the instructions.


### 3. Enable billing

Enable Billing on your project:

In your project's **Firebase Console** upgrade to one of the paid plans using the **UPGRADE** button.


### 4. Install the Firebase CLI and enable Functions on your Firebase CLI

You need to have installed the Firebase CLI. If you haven't already run:

```bash
npm install -g firebase-tools
```

> Doesn't work? You may need to [change npm permissions](https://docs.npmjs.com/getting-started/fixing-npm-permissions).

Once the CLI is installed run: `firebase --open-sesame functions` to enable Firebase Functions on your CLI and follow the instructions.


## Deploy the app to prod

First you need to install the `npm` dependencies of the functions:

```bash
cd functions && npm install; cd ..
```

This installs locally:
 - The Firebase SDK and the Firebase Functions SDK.
 - The [dateformat](https://www.npmjs.com/package/dateformat) npm package to format the current time.
 - The [cors](https://www.npmjs.com/package/cors) npm package to allow Cross Origin AJAX requests on the endpoint.

Deploy to Firebase using the following command:

```bash
firebase deploy
```

This deploys and activate the date Function.

> The first time you call `firebase deploy` on a new project with Functions will take longer than usual.


## Try the sample

You can first simply hit the Function URL directly. After deploying the function you can simply open the following URLs in your browser:

```
https://us-central1-<project-id>.cloudfunctions.net/date

https://us-central1-<project-id>.cloudfunctions.net/date?format=yyyy-mm-dd%20h%3AMM%3Ass
```

The timestamp and formatted date should be displayed.


## Contributing

We'd love that you contribute to the project. Before doing so please read our [Contributor guide](../../CONTRIBUTING.md).


## License

© Google, 2016. Licensed under an [Apache-2](../../LICENSE) license.
