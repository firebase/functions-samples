# Presence in Firestore

This template shows you how to build a presence system (understanding which users are online / offline) in Cloud Firestore with some help from the Realtime Database. An explanation of why this is necessary, how it works, and what changes you need to implement in a client app can be found [in the docs](https://firebase.google.com/docs/firestore/solutions/presence).

## Functions Code

See file [functions/index.js](functions/index.js) for the code.

The dependencies are listed in [functions/package.json](functions/package.json).

## Sample Database Structure

As an example we'll be using a secure note structure:

```
/status
    /UID_A
        state: "online"
    /UID_B
        state: "offline"
```

Whenever a new note is created or modified a Function sends the content to be indexed to the Algolia instance.
