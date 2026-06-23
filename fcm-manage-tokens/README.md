# Manage FCM registration tokens

This sample demonstrates how FCM registration tokens should be
managed on the server side.

1. Clients should regularly send valid tokens to the server and
the server updates their corresponding timestamp.
2. The server should periodically prune stale tokens. Unsubscribing
from topics then deleting them.


## Functions Code

See file [functions/index.js](functions/index.js) for the code.

Storing and pruning the tokens is done using the [Firebase Admin SDK](https://www.npmjs.com/package/firebase-admin).

The dependencies are listed in [functions/package.json](functions/package.json).


## Trigger rules

- updateToken is triggered...
- pruneTokens is triggered...



## Setup and test this sample section

To deploy and test the sample:

 - TODO(kroikie): describe usage of sample

