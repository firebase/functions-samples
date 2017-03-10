# Post GitHub commits to Slack channel.

This sample shows how to automatically post GitHub commits to a Slack channel using an HTTPS Cloud Function.

Further reading:
 - Slack Webhooks API: https://api.slack.com/incoming-webhooks
 - Firebase SDK: https://firebase.google.com/docs/functions
 - GitHub Webhooks: https://developer.github.com/webhooks/creating/

## Functions Code

See file [functions/index.js](functions/index.js) for the code.

Handling the Google Actions requests is done using the [Google Actions SDK](https://www.npmjs.com/package/actions-on-google).

The dependencies are listed in [functions/package.json](functions/package.json).


## Deploy and test

To test this sample action:

 - Create a Firebase Project using the [Firebase Developer Console](https://console.firebase.google.com)
 - Configure this sample to use your project using `firebase --use add` and select your project.
 - [Add a WebHook to your GitHub repo](https://help.github.com/articles/about-webhooks/) with the following settings:
   - Payload URL: `https://us-central1-<FIREBASE_PROJECT_ID>.cloudfunctions.net/githubWebhook`
   - Content type: `application/json`
   - Secret: `A_SECRET_YOU_DEFINE`
   - Which events would you like to trigger this webhook? `Just the push event.`
 - [Add an **Incomming Webhook**](https://my.slack.com/services/new/incoming-webhook/) to your Slack channel and take note of the **Webhook URL**.
 - Set the `slack.webhook_url` and `github.secret` Google Cloud environment variables to match the email and password of the Gmail account used to send emails. For this use:
   ```bash
   firebase functions:config:set slack.webhook_url="https://hooks.slack.com/services/..." github.secret="A_SECRET_YOU_DEFINED_WHEN_SETTING_UP_THE_GITHUB_WEBHOOK"
   ```
 - Deploy your project using `firebase deploy`
 - Make your action available for testing using the `gactions preview action.json`
 - Test your Action on the [Google Home Web Simulator](https://g.co/actionswebsim) by saying "Talk to My Action"
