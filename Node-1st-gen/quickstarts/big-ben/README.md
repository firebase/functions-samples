# Firebase SDK for Cloud Functions Quickstart - HTTPS function with Firebase Hosting URL trigger

This quickstart demonstrates using the **Firebase SDK for Cloud Functions** with an HTTPS trigger that's triggered through a Firebase Hosting URL. The function will display a repeated number of "BONG" depending on the hour of the day.


## Introduction

The function `bigben` returns an HTML page that display a repeated number of "BONG" depending on the hour of the day.

Further reading:

 - [Read more about the Firebase SDK for Cloud Functions](https://firebase.google.com/docs/functions)


## Initial setup, build tools and dependencies

### 1. Clone this repo

Clone or download this repo and open the `quickstarts/big-ben` directory.


### 2. Create a Firebase project and configure the quickstart

Create a Firebase Project on the [Firebase Console](https://console.firebase.google.com).

Set up your Firebase project by running `firebase use --add`, select your Project ID and follow the instructions.


### 3. Install the Firebase CLI

You need to have installed the Firebase CLI, and it always helps to be on the latest version. Run:

```bash
npm install -g firebase-tools
```

> Doesn't work? You may need to [change npm permissions](https://docs.npmjs.com/getting-started/fixing-npm-permissions).

## Try the sample locally

First you need to install the `npm` dependencies of the functions:

```bash
cd functions && npm install; cd ..
```

Start serving your project locally using `firebase serve`

Open the app in a browser at [https://localhost:5000/](https://localhost:5000/).

A page containing a repeated number of "BONG" - One for each hour of the day - will be displayed.

You can click on the **Refresh** button which will call the API by doing an XHR to `/api` and refresh the "BONG" display on the page.


## Deploy the app to prod

First you need to install the `npm` dependencies of the functions:

```bash
cd functions && npm install; cd ..
```

This installs locally the Firebase SDK and the Cloud Functions for Firebase SDK.

Deploy to Firebase using the following command:

```bash
firebase deploy
```

This deploys and activates the `bigben` Function.

> The first time you call `firebase deploy` on a new project with Functions will take longer than usual.


## Try the sample on prod

After deploying the function you can open the following URL in your browser:

```
https://<your-project-id>.firebaseapp.com/bigben
```

A page containing a repeated number of "BONG" will be displayed.


## Contributing

We'd love that you contribute to the project. Before doing so please read our [Contributor guide](../../CONTRIBUTING.md).


## License

© Google, 2016. Licensed under an [Apache-2](../../LICENSE) license.
