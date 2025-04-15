# Send a coupon via FCM to users who have completed a purchase

This sample shows how to send a coupon to your users who have just purchased something. For instance: 10% off on your next purchase!

## Functions Code

See file [functions/index.js](functions/index.js) for the trigger and the FCM code.

The function assumes that you are setting the Firebase Analytics User ID to be the same as the Firebase Auth uid using the setUserId API. Also it is assumed that the FCM Device Tokens need to be saved in the Firebase Realtime Database under `/users/$uid/tokens`.

The dependencies are listed in [functions/package.json](functions/package.json).

## Trigger rules

The function triggers on changes to `in_app_purchase` Firebase Analytics events. For other automatically logged events see: https://support.google.com/firebase/answer/6317485

## Deploy and test

This sample can be tested on your Android and iOS app. To test it out:

- Set the project to your Firebase project using `firebase use --add` then select your projec tin the list.
- Deploy your project using `firebase deploy`
- Make your app trigger the `in_app_purchase` event (somehow).
- Within a few hours the coupon will be sent by an FCM notification.
