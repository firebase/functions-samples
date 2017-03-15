# Periodically delete unused accounts.

This sample demonstrates how to delete the accounts of users who have not signed-in in the last month.


## Functions Code

See file [functions/index.js](functions/index.js) for the code.

Cloud Functions does not natively supports cron jobs. We are working around this by executing the code as an HTTPS triggered function. Then simply use an external service to periodically "ping" the URL.

Here is a non-exhaustive list of external services for cron jobs:
 - https://www.setcronjob.com/
 - https://cron-job.org/
 - https://www.easycron.com/

The dependencies are listed in [functions/package.json](functions/package.json).


## Trigger rules

The function triggers when the HTTP URL of the Function is requested.


## Deploy and test

Set the `cron.key` Google Cloud environment variables to a randomly generated key, this will be used to authorize requests coming from the 3rd-party cron service. For this use:

```bash
firebase functions:config:set cron.key="YOUR_KEY"
```

You can generate a random key, for instance, by running:

```bash
npm install -g crypto
node -e "console.log(require('crypto').randomBytes(20).toString('hex'))"
```

To set up the sample:

 - Create a Firebase Project using the Firebase Developer Console
 - Enable billing since Functions require billing.
 - Download the service accounts using the Firebase Developer Console at: **"Wheely" Icon > Project Settings > Service Accounts > Generate New Private Key** and save it as `./functions/service-accounts.json`.
 - Deploy your project using `firebase deploy`.
 - Open an account with a 3rd party cron service (e.g. www.setcronjob.com, cron-job.org, www.easycron.com, [Zapier](https://zapier.com/zapbook/webhook/) ...) and setup a daily cron job to hit the URL (don't forget to change `YOUR_KEY`):

 ```
 https://us-central1-<project-id>.cloudfunctions.net/accountcleanup?key=YOUR_KEY
 ```
