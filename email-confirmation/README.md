# Send Confirmation Emails with Cloud Functions

This sample shows how to send a confirmation emails to users who are subscribing/un-subscribing to a newsletter.


## Functions Code

See file [functions/index.js](functions/index.js) for the email sending code.

Sending emails is performed using [nodemailer](https://www.npmjs.com/package/nodemailer) a node based Email client with comprehensive EMail server setup. For simplicity, in this sample we're showing how to send email through SMTP using a Gmail account. Be aware that Gmail has an [email sending quota](https://support.google.com/mail/answer/22839). If you are planning on sending a large number of emails you should use a professional email sending platform such as [Sendgrid](https://console.cloud.google.com/launcher/details/sendgrid-app/sendgrid-email), [Mailjet](https://www.mailjet.com/google) or [Mailgun](http://www.mailgun.com/google).

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
 1. Set the `gmail.email` and `gmail.password` Google Cloud environment variables to match the email and password of the Gmail account used to send emails. For this use:
    ```bash
    firebase functions:config:set gmail.email="myusername@gmail.com" gmail.password="secretpassword"
    ```

## Deploy and test

This sample comes with a web-based UI for testing the function. To test it out:

 1. Deploy your project using `firebase deploy`
 1. Open the app using `firebase open hosting:site`, this will open a browser.
 1. Sign in the web app in the browser using Google Sign-In and delete your account using the button on the web app. You should receive email confirmations for each actions.
