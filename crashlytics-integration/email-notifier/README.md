# Crashlytics Email Notifier

Identify important conversion workflows in your app, so that when a new issue is reported in that workflow via Crashlytics, an email is sent to you. This will allow you to react quicker to crashes that impact important conversion workflows of your app.

Crashlytics is a crash reporter for Firebase. 

Note: This assumes that you have Crashlytics in Firebase. [Learn more about Crashlytics](https://firebase.google.com/docs/crashlytics/)


## Setting up the sample

 Create and setup the Firebase project:
  1. Create a Firebase project using the [Firebase Developer Console](https://console.firebase.google.com).
  1. Enable Billing on your Firebase the project by switching to the **Blaze** plan, this is currently needed to be able to perform HTTP requests to external services from a Cloud Function.
  1. Include [Crashlytics in your project](https://firebase.google.com/docs/crashlytics/get-started).

 Configuring the sample
  1. Clone or download this repo and open the `crashlytics-integration/email-notifier` directory.
  1. You must have the Firebase CLI installed. If you don't have it, install it with `npm install -g firebase-tools` and then configure it with `firebase login`.
  1. Configure the CLI locally by using `firebase use --add` and select your project in the list.
  1. Install `npm` dependencies in the functions directory locally, by running: `cd functions; npm install;`
  
 Configuring the Email Service
  1. This sample uses [SendGrid](https://sendgrid.com) to send the emails, but you can use any other email provider.
  1. Create a new SendGrid account that you would like to send notifications/alerts from
  1. This sample will authenticate the account with the [API key](https://app.sendgrid.com/settings/api_keys)
  1. Config and set the environment variables to the SendGrid account you're going to use to send emails: `firebase functions:config:set sendgrid.api_key="your_api_key"`

 Configuring Mailer Options
  1. Specify the email that you would like to use to *receive* the alerts by using: `firebase functions:config:set email.destination_email="destination_address@email.com"`
  1. Specify the email that you would like to use to *send* the alerts by using: `firebase functions:config:set email.from_email="from_address@email.com"
 
 
## Deploy and test

 1. Deploy your project using `firebase deploy`
 1. Simulate a test crash. [Instructions](https://firebase.google.com/docs/crashlytics/force-a-crash)


## Contributing

We'd love that you contribute to the project. Before doing so please read our [Contributor guide](../CONTRIBUTING.md).


## License

© Google, 2017. Licensed under an [Apache-2](../LICENSE) license.
