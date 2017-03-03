# Send a survey when users update your app

This sample shows how to send a survey to your users who have updated your app. App Update is detected using a Firebase Analytics event.


## Functions Code

See file [functions/index.js](functions/index.js) for the trigger and the email sending code.

Sending emails is performed using [nodemailer](https://www.npmjs.com/package/nodemailer) a node based Email client with comprehensive EMail server setup. For simplicity, in this sample we're showing how to send email through SMTP using a Gmail account. Be aware that Gmail has an [email sending quota](https://support.google.com/mail/answer/22839). If you are planning on sending a large number of emails you should use a professional email sending platform such as [Sendgrid](https://console.cloud.google.com/launcher/details/sendgrid-app/sendgrid-email), [Mailjet](https://www.mailjet.com/google) or [Mailgun](http://www.mailgun.com/google).

The dependencies are listed in [functions/package.json](functions/package.json).


## Trigger rules

The function triggers on changes to `app_update` Firebase Analytics event..


## Setting up the sample

Set the `gmail.email` and `gmail.password` Google Cloud environment variables to match the email and password of the Gmail account used to send emails. For this use:

```bash
firebase functions:config:set gmail.email="myusername@gmail.com" gmail.password="secretpassword"
```


## Deploy and test

This sample can be tested on your Android and iOS app. To test it out:

 - Set the project to your Firebase project using `firebase use --add` then select your projec tin the list.
 - Deploy your project using `firebase deploy`
 - Have users update your app, for instance through the play store.
 - Within a few hours the emails to the survey will be sent.
