# Send Firebase Cloud Messaging each time a new user open your app the first time or remove your app from his device.

This sample demonstrates how to send a Firebase Cloud Messaging (FCM) notification from a Analytics triggered Function.


## Functions Code

See file [functions/index.js](functions/index.js) for the code.

Sending the notification is done using the [Firebase Admin SDK](https://www.npmjs.com/package/firebase-admin).

The dependencies are listed in [functions/package.json](functions/package.json).


## Trigger rules

The functions triggers every time a new user open your app the first time or remove your app from his device.

## Setup and test this sample section

To deploy and test the sample:

 - Create a Firebase project on the [Firebase Console](https://console.firebase.google.com)
 - Install the required dependencies by running `npm install` in the `functions` directory
 - Add this log to your android project:

```bash
  Log.d("Firebase", "token "+ FirebaseInstanceId.getInstance().getToken());
```
 - Copy your device token from the android logcat  
 - Set the `dev_motivator.device_token` Google Cloud environment variables. For this use:

```bash
firebase functions:config:set dev_motivator.device_token="your_developer_device_token" 
```
 - Deploy your project's code using `firebase deploy`