# Send Firebase Cloud Messaging each time a new user open your app the first time or remove your app from his device.

This sample demonstrates how to send a Firebase Cloud Messaging (FCM) notification from a Analytics triggered Function.


## Functions Code

See file [functions/index.js](functions/index.js) for the code.

Sending the notification is done using the [Firebase Admin SDK](https://www.npmjs.com/package/firebase-admin).

The dependencies are listed in [functions/package.json](functions/package.json).


## Trigger rules

The functions triggers every time a new user open your app the first time or remove your app from his device.

## Setup and test this sample section
Could you add a ## Setup and test this sample section giving a step by step process to follow in order to get the sample running, for instance the tricky part will be how to get a developer device token