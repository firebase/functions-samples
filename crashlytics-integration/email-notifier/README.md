# Crashlytics Email Notifier

Identify important conversion workflows in your app, so that when a new issue is reported in that workflow via Crashlytics, an email will be sent to you or the specified recipient. This will allow you to react quicker to crashes that impact important conversion workflows of your app.

Crashlytics will become the future crash reporter for Firebase. Learn more about Crashlytics [here](https://fabric.io/kits/android/crashlytics/summary?ref=fb).

## Setting up the sample

 Create and setup the Firebase project:
  1. Create a Firebase project using the [Firebase Developer Console](https://console.firebase.google.com).
  1. Enable Billing on your Firebase the project by switching to the **Blaze** plan, this is currently needed to be able to perform HTTP requests to external services from a Cloud Function.

 Create and setup Crashlytics in your app:
  1. Create an account on [Fabric](https://fabric.io/kits?show_signup=true).
  1. Setup Crashlytics for your app as described in the [Crashlytics setup instructions](https://fabric.io/kits/android/crashlytics)

 Configuring the sample
  1. Clone or download this repo and open the `crashlytics-integration/email-notifier` directory.
  1. You must have the Firebase CLI installed. If you don't have it install it with `npm install -g firebase-tools` and then configure it with `firebase login`.
  1. Configure the CLI locally by using `firebase use --add` and select your project in the list.
  1. Install dependencies locally by running: `cd functions; npm install;`
  1. Configure the Firebase CLI to set your Fabric Project ID `firebase functions:config:set fabric.project_id="<YOUR_FABRIC_PROJECT_ID>"`
      1. How do I find my Fabric Project ID? Go into App Settings in your Fabric Dashboard and select the app you would like to use. The URL will contain your Fabric Project Id: `https://fabric.io/settings/apps/<YOUR_FABRIC_PROJECT_ID>`
  
 Configuring the Email Service
  1. This sample uses [Gmail](https://mail.google.com), but you can alternatively use any email providers.
  1. Create a new Gmail account that you would like to send notifications/alerts from
  1. This sample will use basic user/pass authentication, you may also use and setup a [service account](https://developers.google.com/identity/protocols/OAuth2ServiceAccount) instead
  1. Config and set the environment variables to the Gmail account you're going to use to send emails: `firebase functions:config:set email.user="myusername@gmail.com" email.pass="secretpassword"`

 Configuring Mailer Options
  1. Specify the email that you would like to use to *receive* the alerts by using: `firebase functions:config:set email.recipient_address="me@gmail.com"`
  1. The [Nodemailer documentation](https://nodemailer.com/usage/) contains more documentation on how to further customize your message or use alternative auth methods 
   
## Deploy and test

 1. Deploy your project using `firebase deploy`
 1. Simulate a test crash. [Android Instructions](https://docs.fabric.io/android/crashlytics/test-crash.html) | [iOS Instructions](https://docs.fabric.io/apple/crashlytics/test-crash.html)


## Contributing

We'd love that you contribute to the project. Before doing so please read our [Contributor guide](../CONTRIBUTING.md).


## License

© Google, 2017. Licensed under an [Apache-2](../LICENSE) license.
