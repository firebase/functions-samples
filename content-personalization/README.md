# Content personalization

In general, this sample demonstrates how database triggers can be used to personalize content. In particular, this sample listens for "like" events, eg taps on a like button for a post in a feed, and then generates "follow" recommendations based on other users who have liked the same item.

## Functions Code

* [functions/index.js](index.js) defines Functions integration
* [functions/controller.js](controller.js) defines business logic
* [functions/model.js](model.js) defines storage logic
* [functions/test/](test) defines tests

## Set up

1. `cd functions`
1. `npm install`

## Usage

1. Write data to `/likes/<user id>/<item id>`, eg

        const values = {};
        values[postId] = true;
        db.ref(`/likes/${userId}`).set(values)

1. Read recommendations from `/recs/<user id>`

## Testing

### In-memory

1. `npm test`

### Using Firebase database

*Note:* this mode will perform read/write operations on the database associated with the given service account

1. Generate and download private key (as described in the [admin docs](https://firebase.google.com/docs/admin/setup))
1. `./node_modules/mocha/bin/mocha test/integration.js <path to downloaded private key>`

## Linting

1. Lint (and fix when possible): `npm run fix`

## Deploying

1. `firebase deploy --only functions --project <your project id>`

