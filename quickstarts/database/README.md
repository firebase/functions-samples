# Firebase Functions Quickstart - Database

This quickstart demonstrates using **Firebase Functions** and its interaction with a **Firebase database** through a simple **Web app**.


## Introduction

This sample app is a Message board where anyone can add messages through a Web app.
A Server Side Firebase Function automatically detect all-uppercased messages (SHOUTING) and makes them lowercase as soon as they are inserted in the Firebase database.

Further reading:

 - [Read more about Firebase Functions](https://firebase.google.com/preview/functions/)


## Initial setup, build tools and dependencies

### 1. Clone this repo

Clone or download this repo and open the `database` directory.


### 2. Create a Firebase project and configure the quickstart

Create a Firebase Project on the [Firebase Console](https://console.firebase.google.com).

In the Firebase Console's project **Overview** click the **Add Firebase to your web app** button. Copy the web initialisation snippet and paste it in the `head` section of the `./public/index.html` file where the `TODO(DEVELOPER)...` placeholder is.

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

This installs locally the Firebase SDK and the Firebase Functions SDK.

Deploy to Firebase using the following command:

```bash
firebase deploy
```

This deploys the Web app on Firebase static hosting.
This also deploys and activate the Function that will make all of your messages uppercase.

> The first time you call `firebase deploy` on a new project with Functions will take longer than usual.


## Data Model

In this sample we use the following data model:

```
\functions-quickstart-12345
    \messages
        key-123456: "This is my first message!"
        key-123457: "This is my second message!"
```

 - `\functions-quickstart-12345\messages` is a list of String values. New messages get pushed in this list.
 - A message is a string value pushed to the list.


## See the results

Once your Function is deployed add the following objects to your Firebase Database manually using the Firebase Console:

```
\functions-quickstart-12345
    \uppercase
        key-123456: "This is my first message!"
        key-123457: "This is my second message!"
```

Adding these objects triggers the function which makes the messages uppercase:

```
\functions-quickstart-12345
    \uppercase
        key-123456: "THIS IS MY FIRST MESSAGE!"
        key-123457: "THIS IS MY SECOND MESSAGE!"
```

Now try to add messages using the Web app which is now served from `https://<PROJECT_ID>.firebaseapp.com`. You can open the app using:

```bash
firebase open
```

On the Web app messages will get uppercased automatically shortly after you add them.


## Contributing

We'd love that you contribute to the project. Before doing so please read our [Contributor guide](../../CONTRIBUTING.md).


## License

© Google, 2016. Licensed under an [Apache-2](../../LICENSE) license.
