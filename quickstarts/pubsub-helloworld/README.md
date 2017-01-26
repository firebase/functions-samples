# Firebase Functions Quickstart - PubSub trigger

This quickstart demonstrates using **Firebase Functions** setup with an PubSub trigger.


## Introduction

We'll show a basic PubSub triggered Functions.

Further reading:

 - [Read more about Firebase Functions](https://firebase.google.com/preview/functions/)


## Initial setup, build tools and dependencies

### 1. Clone this repo

Clone or download this repo and open the `http` directory.


### 2. Create a Firebase project and configure the quickstart

Create a Firebase Project on the [Firebase Console](https://console.firebase.google.com).

Set up your Firebase project by running `firebase use --add`, select your Project ID and follow the instructions.


### 3. Install the Firebase CLI and enable Functions on your Firebase CLI

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

This installs locally the Firebase SDK and the Firebase Functions SDK.

Deploy to Firebase using the following command:

```bash
firebase deploy
```

This deploys and activate the date Function.

> The first time you call `firebase deploy` on a new project with Functions will take longer than usual.


## Try the sample

Once deployed, to try the sample use the `glcoud` CLI to publish a message to the `topic-name` topic:

```
gcloud alpha pubsub topics publish [YOUR_TOPIC_NAME] 'YourName'
```

Open the Functions logs in the Firebase Console, you should see a messages that reads "Hello YourName".


## Contributing

We'd love that you contribute to the project. Before doing so please read our [Contributor guide](../../CONTRIBUTING.md).


## License

© Google, 2016. Licensed under an [Apache-2](../../LICENSE) license.
