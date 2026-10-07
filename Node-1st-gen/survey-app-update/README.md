# Send a survey when users update your app

This sample shows how to send a survey to your users who have updated your app. App Update is detected using a Firebase Analytics event.


## Functions Code

See file [functions/index.js](functions/index.js) for the trigger and the email sending code.

Sending emails is performed using [Resend](https://resend.com/). Resend offers a free tier and a test sender address, `onboarding@resend.dev`, that only delivers to the email address of your own Resend account. To send to other addresses, [verify a domain](https://resend.com/domains) and change the `from` address in `functions/index.js`.

> Sending requests to non-Google services requires billing to be enabled on your Firebase project.

The dependencies are listed in [functions/package.json](functions/package.json).


## Trigger rules

The function triggers on changes to `app_update` Firebase Analytics events. For other automatically logged events see: https://support.google.com/firebase/answer/6317485


## Setting up the sample

 1. Replace `LINK_TO_SURVEY` in `functions/index.js` with the URL of your own survey.
 1. Create a [Resend API key](https://resend.com/api-keys) and store it in the `EMAIL_API_KEY` secret:

    ```bash
    firebase functions:secrets:set EMAIL_API_KEY
    ```

    To run the function in the emulator, put the key in `functions/.secret.local` instead. The emulator reads secret values from that file; see [Secrets and credentials in the emulator](https://firebase.google.com/docs/functions/config-env#secrets_and_credentials_in_the_emulator).

    ```bash
    EMAIL_API_KEY="re_123456789"
    ```


## Deploy and test

This sample can be tested on your Android and iOS app. To test it out:

 - Make sure you set the `app_update` events as being a **Conversion event** in your project. You can do this on the Analytics section > Events tab.
 - Set the project to your Firebase project using `firebase use --add` then select your project in the list.
 - Deploy your project using `firebase deploy`
 - Have users update your app, for instance through the play store.
 - Within a few hours the emails to the survey will be sent.
