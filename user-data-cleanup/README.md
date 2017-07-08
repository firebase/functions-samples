# Cleanup user data upon account deletion.

This sample shows how to cleanup the user data when they delete their account.


## Functions Code

See file [functions/wipeout.js](functions/wipeout.js) for the data cleanup code.

When a user deletes their account, their data in the database will be deleted
automatically. The function needs configuration to find according user data. The
configuration can be specified in local file
[functions/wipeout_config.json](functions/wipeout_conifg.json). If the file
doesn't exists or doesn't contain a valid configuration object, the function
will go ahead and infer the configuration from Firebase database authorization
rules (verification of the inferred rules will be in the next release).

The configuration is a json object and its `wipeout` filed is a list of objects.
Each object in the list has a string field called `path` specifying a path where
user data is stored. The path string could use variable `$WIPEOUT_UID` which
will be replaced by UID of the deleted user account when triggered.

Please don't change the `WIPEOUT_CONFIG` object in `functions/index.js` unless
you want to customize the function and know the code well.

The dependencies are listed in [functions/package.json](functions/package.json).


## Sample Database Structure

When a user signs-in we write some sample personal data of the following form:

```
/functions-project-12345
    /users
        $uid : "Some user data"
```

When the user delete their account a Function will trigger and automatically 
delete the corresponding user data in the realtime database.


## Trigger rules

The function triggers on user account deletions.


## Deploy and test

This sample comes with a Function and web-based UI for testing the function. 
To configure it:

 1. Create a Firebase Project using the [Firebase Console](https://console.firebase.google.com).
 1. Enable Google Auth. In the Firebase Console open the 
 **Authentication** section > **SIGN IN METHOD** tab 
 you need to enable the **Google** Sign-in Provider and click **SAVE**. 
 1. Clone or download this repo and open the `user-data-cleanup` directory.
 1. You must have the Firebase CLI installed. If you don't have it install it with `npm install -g firebase-tools` and then configure it with `firebase login`.
 1. Configure the CLI locally by using `firebase use --add` and select your project in the list.
 1. Install dependencies locally by running: `cd functions; npm install; cd -`
 1. Run local tests using `cd functions; npm test`
 1. Deploy your project using `firebase deploy`
 1. Open the app using `firebase open hosting:site`, this will open a browser.
 1. Sign in using Google Sign-In and delete the account using the provided button. You can check at each step of the way if the data has been deleted using the Firebase console.
 
