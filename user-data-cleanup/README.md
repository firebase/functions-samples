# Cleanup user data upon account deletion.

This sample shows how to cleanup the user data when he deletes his account.


## Functions Code

See file [functions/index.js](functions/index.js) for the email sending code.

Sending emails is performed using [nodemailer](https://www.npmjs.com/package/bad-words) a node based Email client with comprehensive EMail server setup. In this sample we're showing how to send email through SMTP using a Gmail account. Be aware that Gmail has an [email sending quota](). If you are planning on sending a large number of emails you should use a professional email sending platform such as Sendgrid

The dependencies are listed in [functions/package.json](functions/package.json).


## Sample Database Structure

When a user signs-in we write some sample personal data of the following form:

```
/functions-project-12345
    /users
        $uid : "Some user data"
```

When the user deletes his account a Function will trigger and automatically delete the corresponding user data in the realtime database.


## Trigger rules

The function triggers on user account deletions.


## Setting up the sample

This sample comes with a web-based UI for testing the function. To set it up:

 - Create a Firebase Project using the Firebase Developer Console
 - Enable Google Provider in the Auth section
 - Import and configure Firebase in the `public/index.html` where the `TODO` is located


## Deploy and test

This sample comes with a web-based UI for testing the function. To test it out:

 - Deploy your project using `firebase deploy`
 - Open the app using `firebase open`, Sign in using Google Sign-In and delete the account using the provided button. You can check at each step of the way if the data has been deleted using the Firebase console.
