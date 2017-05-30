# Cleanup user data upon account deletion.

This sample shows how to cleanup the user data when they delete their account.


## Functions Code

See file [functions/index.js](functions/index.js) for the data cleanup code.

The dependencies are listed in [functions/package.json](functions/package.json).


## Sample Database Structure

When a user signs-in we write some sample personal data of the following form:

```
/functions-project-12345
    /users
        $uid : "Some user data"
```

When the user delete their account a Function will trigger and automatically delete the corresponding user data in the realtime database.


## Trigger rules

The function triggers on user account deletions.


## Deploy and test

This sample comes with a Function and web-based UI for testing the function. To configure it:

 1. Create a Firebase Project using the [Firebase Console](https://console.firebase.google.com).
 1. Clone or download this repo and open the `user-data-cleanup` directory.
 1. You must have the Firebase CLI installed. If you don't have it install it with `npm install -g firebase-tools` and then configure it with `firebase login`.
 1. Configure the CLI locally by using `firebase use --add` and select your project in the list.
 1. Install dependencies locally by running: `cd functions; npm install; cd -`
 1. Deploy your project using `firebase deploy`
 1. Open the app using `firebase open hosting:site`, this will open a browser.
 1. Sign in using Google Sign-In and delete the account using the provided button. You can check at each step of the way if the data has been deleted using the Firebase console.
