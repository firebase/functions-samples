# Presence in Firestore

This template shows you how to build a presence system (understanding which users are online / offline) in Firestore with some help from the Realtime Database. An explanation of why this is necessary, how it works, and what changes you need to implement in a client app can be found [in the docs](https://firebase.google.com/docs/firestore/solutions/presence).

## Functions Code

See file [functions/index.js](functions/index.js) for the code.

The dependencies are listed in [functions/package.json](functions/package.json).

To install:

```sh
cd functions
npm install
```

## Sample Database Structure

As an example we'll be using a secure note structure:

```
/status
    /UID_A
        state: "online"
    /UID_B
        state: "offline"
```

Whenever a new note is created or modified a Function sends the content to be indexed to the Firestore instance.

## Sample Client Code

The sample client app in [public/index.html](public/index.html) and [public/index.js](public/index.js) will anonymously log in the user, create `status/UID_A` with a `last_changed` and `state` in `Realtime Database`, then mirror that over to a `UID_A` document in the app's `Firestore` collection `status`.

To deploy the sample to your Firebase app,

1. Run `npm install` to install dependencies for the server-side [functions](functions/) as detailed above.
2. From this top-level sample directory, deploy the `Realtime Database` trigger defined in [functions](functions/) to `Firebase Functions` and the [public](public/) directory app to `Firebase Hosting`.

Assumimg you've created a Firebase application called `firebase-example-123` (make sure it's upgraded to the Spark plan and that `Anonymous Authentication` are enabled).

```sh
firebase use --add firebase-example-123
firebase deploy
```

Then visit `https://firebase-example-123.web.app` in your browser and you should see `User <UID_A>` is online written to the index file, as well as the associated data in `Realtime Database` and `Firestore`.
