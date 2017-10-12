# Presence in Firestore

This template shows you how to build a presence (understanding which users are online / offline) in Cloud Firestore and Realtime Database.

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