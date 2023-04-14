# Get notified each time a new user opens your app the first time or removes your app from their device.

This sample demonstrates how to send a Firebase Cloud Messaging (FCM) notification from a Analytics triggered Function.


## Functions Code

See file [functions/index.js](functions/index.js) for the code.

Sending the notification is done using the [Firebase Admin SDK](https://www.npmjs.com/package/firebase-admin).

The dependencies are listed in [functions/package.json](functions/package.json).


## Trigger rules

The functions triggers every time a new user opens your app the first time or removes your app from their device.


## Setup and test this sample section

To deploy and test the sample:

 - Create a Firebase project on the [Firebase Console](https://console.firebase.google.com)
 - In the Firebase Console, under `Analytics`, in the `Events` tab, mark the `app_remove` event a conversion event by switching the toggle. The `first_open` event should already be marked as such.
 - Install the required dependencies by running `npm install` in the `functions` directory
 - Add this log to your android project:

    ```bash
    Log.d("Firebase", "token "+ FirebaseInstanceId.getInstance().getToken());
    ```
 - Run your app on your device and copy the device token from the android logcat
 - Set the `dev_motivator.device_token` Google Cloud environment variables. For this use:

    ```bash
    firebase functions:config:set dev_motivator.device_token="your_developer_device_token"
    ```
 - Deploy your project's code using `firebase deploy`
 - You'll now get a notification on your mobile when a user opens your app for the first time and when they uninstall your app.

