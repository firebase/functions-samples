# Firebase SDK for Cloud Functions Quickstart - Auth triggers

This quickstart demonstrates how to setup an Auth triggered Cloud Function using the **Firebase SDK for Cloud Functions**.


## Introduction

We'll deploy 2nd gen Auth triggered Functions that send a welcome email when a new user signs up and a goodbye email when user accounts are deleted.

Further reading: [Firebase SDK for Cloud Functions](https://firebase.google.com/docs/functions/)


## Functions Code

See file [functions/index.js](functions/index.js) for the Functions trigger and the email sending code.

Sending emails is performed using [nodemailer](https://www.npmjs.com/package/nodemailer), a node-based email client with comprehensive email server setup. For simplicity, in this sample we're showing how to send email through SMTP using a Gmail account. Be aware that Gmail has an [email sending quota](https://support.google.com/mail/answer/22839). If you are planning on sending a large number of emails you should use a professional email sending platform such as SendGrid, Mailjet, or Mailgun.

> If switching to Sendgrid, Mailjet or Mailgun make sure you enable billing on your Firebase project as this is required to send requests to non-Google services.

The dependencies are listed in [functions/package.json](functions/package.json).

This sample comes with a simple web-based UI whose code is in the [public](public) directory that lets you easily sign in to Firebase and delete your account for purposes of testing the functions.


## Setting up the sample

 1. Create a Firebase Project using the [Firebase Console](https://console.firebase.google.com).
 1. Enable the **Google** Provider in the **Auth** section.
 1. Clone or download this repo and open the `quickstarts/email-users` directory.
 1. You must have the Firebase CLI installed. If you don't have it install it with `npm install -g firebase-tools` and then configure it with `firebase login`.
 1. Configure the CLI locally by using `firebase use --add` and select your project in the list.
 1. Install Cloud Functions dependencies locally by running: `cd functions; npm install; cd -`
 1. To be able to send emails with your Gmail account: enable access to [Less Secure Apps](https://www.google.com/settings/security/lesssecureapps) and [Display Unlock Captcha](https://accounts.google.com/DisplayUnlockCaptcha). For accounts with 2-step verification enabled [Generate an App Password](https://support.google.com/accounts/answer/185833).
 1. This sample uses [parameterized configuration and Cloud KMS secrets](https://firebase.google.com/docs/functions/config-env). Set `GMAIL_EMAIL` and `GMAIL_PASSWORD`:
    - For `GMAIL_PASSWORD`, store it as a secret using Cloud Secret Manager:
      ```bash
      firebase functions:secrets:set GMAIL_PASSWORD
      ```
    - For `GMAIL_EMAIL`, you will be prompted when deploying, or you can define it in a `.env` file or `functions/.env`:
      ```bash
      GMAIL_EMAIL="myusername@gmail.com"
      ```


## Deploy and test

This sample comes with a web-based UI for testing the function. To test it out:

 1. Deploy your project using `firebase deploy`
 1. Open the app using `firebase open hosting:site`, this will open a browser.
 1. Sign in to the web app in the browser using Google Sign-In and delete your account using the button on the web app. You should receive email confirmations for each action.


## Contributing

We'd love that you contribute to the project. Before doing so please read our [Contributor guide](../../CONTRIBUTING.md).


## License

© Google, 2024. Licensed under an [Apache-2](../../LICENSE) license.
