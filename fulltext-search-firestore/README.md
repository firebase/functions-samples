# Full Text search via Algolia

This template shows how to enable full text search on Cloud Firestore documents by using an [Algolia](https://algolia.com) hosted search service.

## Functions Code

See file [functions/index.js](functions/index.js) for the code.

The dependencies are listed in [functions/package.json](functions/package.json).

## Sample Cloud Firestore Structure

As an example we'll be using a secure note structure:

```
/notes
    /note-123456
        text: "This is my first note...",
        author: "FIREBASE_USER_ID"
    /note-123457
        text: "This is my second note entry...",
        author: "FIREBASE_USER_ID"
        tags: ["some_category"]
```

Whenever a new note is created or modified a Function sends the content to be indexed to the Algolia instance.

To securely search notes, a user is issued a [Secured API Key](https://www.algolia.com/doc/guides/security/api-keys/#secured-api-keys) from Algolia which
limits which documents they can search through.

## Setting up the sample

For setup and overview, please see the [Full Text Search Solution](https://firebase.google.com/docs/firestore/solutions/search) in the
Cloud Firestore documentation.
