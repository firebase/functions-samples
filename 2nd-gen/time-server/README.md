# Firebase SDK for Cloud Functions Quickstart - HTTPS trigger

This quickstart demonstrates using the **Firebase SDK for Cloud Functions** with an HTTPS trigger through building an endpoint returning the current time.


## Introduction

The function `date` returns the current server date. You can pass it a `format` URL Query parameter to format the date.

Further reading:

 - [Read more about the Firebase SDK for Cloud Functions](https://firebase.google.com/docs/functions)


## Initial setup, build tools and dependencies

### 1. Clone this repo

Clone or download this repo and open the `quickstarts/time-server` directory.


### 2. Create a Firebase project and configure the quickstart

Create a Firebase Project on the [Firebase Console](https://console.firebase.google.com).

Set up your Firebase project by running `firebase use --add`, select your Project ID and follow the instructions.


### 3. Install the Firebase CLI and enable Functions on your Firebase CLI

You need to have installed the Firebase CLI. If you haven't run:

```bash
npm install -g firebase-tools
```

> Doesn't work? You may need to [change npm permissions](https://docs.npmjs.com/getting-started/fixing-npm-permissions).


## Deploy the app to prod

First you need to install the `npm` dependencies of the functions:

```bash
cd functions && npm install; cd ..
```

This installs locally:
 - The Firebase SDK and the Firebase Functions SDK.
 - The [moment](https://www.npmjs.com/package/moment) npm package to format time.

Deploy to Firebase using the following command:

```bash
firebase deploy
```

This deploys and activates the date Function.

> The first time you call `firebase deploy` on a new project with Functions will take longer than usual.


Alteratively, you can call `firebase emulators:start` to test the functions on the local emulator suite.


## Try the sample

After deploying the function you can open the following URLs in your browser (a separate instance is created for each region):

```
https://us-central3-<project-id>.cloudfunctions.net/date

https://us-central3-<project-id>.cloudfunctions.net/date?format=MMMM%20Do%20YYYY%2C%20h%3Amm%3Ass%20a

https://us-west1-<project-id>.cloudfunctions.net/date

https://us-west1-<project-id>.cloudfunctions.net/date?format=MMMM%20Do%20YYYY%2C%20h%3Amm%3Ass%20a
```

You can also send the format in the request body. For instance using cURL in the command line:

```bash
curl -H 'Content-Type: application/json' /
     -d '{"format": "MMMM Do YYYY, h:mm:ss a"}' /
     https://us-central3-<project-id>.cloudfunctions.net/date
```
Formatted dates should be displayed.

We are responding with a 403 error in case of PUT requests:

```bash
curl -X PUT -d '{"format": "MMMM Do YYYY, h:mm:ss a"}' https://us-central3-<project-id>.cloudfunctions.net/date
```


## Contributing

We'd love that you contribute to the project. Before doing so please read our [Contributor guide](../../CONTRIBUTING.md).


## License

TODOJ
