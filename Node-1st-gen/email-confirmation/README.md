# Send Confirmation Emails with Cloud Functions

This sample shows how to send a confirmation emails to users who are subscribing/un-subscribing to a newsletter.


## Functions Code

See file [functions/index.js](functions/index.js) for the email sending code.

Sending emails is performed using [Resend](https://resend.com/). Resend offers a free tier and a test sender address, `onboarding@resend.dev`, that only delivers to the email address of your own Resend account. To send to other addresses, [verify a domain](https://resend.com/domains) and change the `from` address in `functions/index.js`.

> Sending requests to non-Google services requires billing to be enabled on your Firebase project.

The dependencies are listed in [functions/package.json](functions/package.json).


## Sample Database Structure

When a signed-in user subscribes or unsubscribes to the mailing list we change the `subscribedToMailingList` boolean:

```
/functions-project-12345
    /users
        /$uid
            subscribedToMailingList: true,
            email: "user@domain.com"
```

Then the email stored here is used by the function to send the email.


## Trigger rules

The function triggers on changes to `/users/$uid` and exits if there are no changes to `subscribedToMailingList`.


## Setting up the sample

 1. Create a Firebase Project using the [Firebase Console](https://console.firebase.google.com).
 1. Enable the **Google** Provider in the **Auth** section.
 1. Clone or download this repo and open the `email-confirmation` directory.
 1. You must have the Firebase CLI installed. If you don't have it install it with `npm install -g firebase-tools` and then configure it with `firebase login`.
 1. Configure the CLI locally by using `firebase use --add` and select your project in the list.
 1. Install dependencies locally by running: `cd functions; npm install; cd -`
 1. Create a [Resend API key](https://resend.com/api-keys) and store it in the `EMAIL_API_KEY` secret:

    ```bash
    firebase functions:secrets:set EMAIL_API_KEY
    ```

    To run the function in the emulator, put the key in `functions/.env.local` instead:

    ```bash
    EMAIL_API_KEY="re_123456789"
    ```

## Deploy and test

This sample comes with a web-based UI for testing the function. To test it out:

 1. Deploy your project using `firebase deploy`
 1. Open the app using `firebase open hosting:site`, this will open a browser.
 1. Sign in the web app in the browser using Google Sign-In and delete your account using the button on the web app. You should receive email confirmations for each actions.
