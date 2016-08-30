# Send Confirmation Emails with Firebase Cloud Functions

This template shows how to send a confirmation emails to users who are subscribing/un-subscribing to a newsletter.


## Functions Code

See file [index.js](index.js) for the email sending code.

Sending emails is performed using [nodemailer](https://www.npmjs.com/package/bad-words) a node based Email client with comprehensive EMail server setup. In this sample we're showing how to send email through SMTP using a Gmail account.

The dependencies are listed in [package.json](package.json).


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


## Deploy and test

This sample comes with a web-based UI for testing the function. To test it out:

 - Create a Firebase Project using the Firebase Developer Console
 - Enable Google Provider in the Auth section
 - Import and configure Firebase in the `public/index.html` where the `TODO` is located
 - Setup your email transport in the `functions/index.html` where the `TODO` is located
 - Deploy your project using `firebase deploy`
 - Open the app, Sign in using Google Sign-In and subscribe/unsubscribe to the newsletter and you should receive email confirmations
