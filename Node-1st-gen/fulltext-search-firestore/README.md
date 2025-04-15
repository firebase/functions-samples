# Full Text search

This template shows how to enable full text search on Firestore documents by using one of the followning hosted search services:

- [Algolia](https://algolia.com)
- [Elastic](https://elastic.co)
- [Typesense](https://typesense.org)

## Functions Code

See file [functions/index.js](functions/index.js) for the code.

The dependencies are listed in [functions/package.json](functions/package.json).

## Sample Firestore Structure

As an example we'll be using a secure note structure:

```
/notes
    /note-123456
        text: "This is my first note...",
        owner: "FIREBASE_USER_ID"
    /note-123457
        text: "This is my second note entry...",
        owner: "FIREBASE_USER_ID"
        tags: ["some_category"]
```

Whenever a new note is created or modified a Function sends the content to be indexed.

## Setting up the sample

For setup and overview, please see the [Full Text Search Solution](https://firebase.google.com/docs/firestore/solutions/search) in the
Firestore documentation.
