# Firebase SDK for Cloud Functions Quickstart - Auth triggers

This quickstart demonstrates how to setup an Auth triggered Cloud Function using the **Firebase SDK for Cloud Functions**.


## Introduction

We'll deploy Auth triggered Functions that send a welcome email when a new user signs up and a goodbye email when user accounts are deleted.

Further reading: [Firebase SDK for Cloud Functions](https://firebase.google.com/docs/functions/)


## Functions Code

See file [functions/index.js](functions/index.js) for the Functions trigger and the email sending code.

Sending emails is performed using [nodemailer](https://www.npmjs.com/package/nodemailer) a node based Email client with comprehensive EMail server setup. For simplicity, in this sample we're showing how to send email through SMTP using a Gmail account. Be aware that Gmail has an [email sending quota](https://support.google.com/mail/answer/22839). If you are planning on sending a large number of emails you should use a professional email sending platform such as [Sendgrid](https://console.cloud.google.com/launcher/details/sendgrid-app/sendgrid-email), [Mailjet](https://www.mailjet.com/google) or [Mailgun](http://www.mailgun.com/google).

The dependencies are listed in [functions/package.json](functions/package.json).

This sample comes with a simple web-based UI which code is in [public](public) directory that lets you easily sign-in Firebase and delete your account for purposes of testing the Functions.


## Setting up the sample

 1. Create a Firebase Project using the [Firebase Console](https://console.firebase.google.com).
 1. Enable the **Google** Provider in the **Auth** section.
 1. Clone or download this repo and open the `quickstarts/email-users` directory.
 1. You must have the Firebase CLI installed. If you don't have it install it with `npm install -g firebase-tools` and then configure it with `firebase login`.
 1. Configure the CLI locally by using `firebase use --add` and select your project in the list.
 1. Install CLoud Functions dependencies locally by running: `cd functions; npm install; cd -`
 1. Enable access to [Less Secure Apps](https://www.google.com/settings/security/lesssecureapps) and [Display Unlock Captcha](https://accounts.google.com/DisplayUnlockCaptcha).
 
    For accounts with 2-step verification enabled [Generate App Password](https://support.google.com/accounts/answer/185833).
 1. Set the `gmail.email` and `gmail.password` Google Cloud environment variables to match the email and password of the Gmail account used to send emails. For this use:

    ```bash
    firebase functions:config:set gmail.email="myusername@gmail.com" gmail.password="secretpassword"
    ```
 


## Deploy and test

This sample comes with a web-based UI for testing the function. To test it out:

 1. Deploy your project using `firebase deploy`
 1. Open the app using `firebase open hosting:site`, this will open a browser.
 1. Sign in the web app in the browser using Google Sign-In and delete your account using the button on the web app. You should receive email confirmations for each actions.


## Contributing

We'd love that you contribute to the project. Before doing so please read our [Contributor guide](../../CONTRIBUTING.md).


## License

© Google, 2016. Licensed under an [Apache-2](../../LICENSE) license.
