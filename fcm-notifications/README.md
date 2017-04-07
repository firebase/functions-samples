# Send Firebase Cloud Messaging notifications for new followers.

This sample demonstrates how to send a Firebase Cloud Messaging (FCM) notification from a Realtime Database triggered Function. The sample also features a Web UI to experience the FCM notification.


## Functions Code

See file [functions/index.js](functions/index.js) for the code.

Sending the notification is done using the [Firebase Admin SDK](https://www.npmjs.com/package/firebase-admin). The Web client writes the individual device tokens to the realtime database which the Function uses to send the notification.

The dependencies are listed in [functions/package.json](functions/package.json).


## Sample Database Structure

Users sign into the app and are requested to enable notifications on their browsers. If they successfully enable notifications the device token is saved into the datastore under `/users/$uid/notificationTokens`.:

```
/functions-project-12345
    /users
        /Uid-12345
            displayName: "Bob Dole"
            /notificationTokens
                1234567890: true
            photoURL: "https://lh3.googleusercontent.com/..."

```

If a user starts following another user we'll write to `/followers/$followedUid/$followerUid`:

```
/functions-project-12345
    /followers
        /followedUid-12345
            followerUid-67890: true
    /users
        /Uid-12345
            displayName: "Bob Dole"
            /notificationTokens
                1234567890: true
            photoURL: "https://lh3.googleusercontent.com/..."

```


## Trigger rules

The function triggers every time the value of a follow flag changes at `/followers/$followedUid/$followerUid`.


## Deploy and test

This sample comes with a web-based UI for testing the function. To test it out:

 1. Create a Firebase Project using the [Firebase Console](https://console.firebase.google.com).
 1. Enable **Google Provider** in the [Auth section](https://console.firebase.google.com/project/_/authentication/providers)
 1. Clone or download this repo and open the `fcm-notification` directory.
 1. You must have the Firebase CLI installed. If you don't have it install it with `npm install -g firebase-tools` and then configure it with `firebase login`.
 1. Configure the CLI locally by using `firebase use --add` and select your project in the list.
 1. Install dependencies locally by running: `cd functions; npm install; cd -`
 1. Deploy your project using `firebase deploy`
 1. Open the app using `firebase open hosting:site`, this will open a browser.
 1. Start following a user, this will send a notification to him.
