# Periodically delete unused accounts

This sample demonstrates how to delete the accounts of users who have not signed-in in the last month.


## Functions Code

See the file [functions/index.js](functions/index.js) for the code.

Cloud Functions does not natively supports cron jobs. We are working around this by executing the code as an HTTPS-triggered function. Then simply use an external service to periodically "ping" the URL.

Here is a non-exhaustive list of external services for cron jobs:
 - https://cloud.google.com/scheduler/
 - https://cron-job.org/
 - https://www.setcronjob.com/
 - https://www.easycron.com/
 - https://zapier.com/zapbook/webhook/

The dependencies are listed in [functions/package.json](functions/package.json).


## Trigger rules

The function triggers when the HTTP URL of the Function is requested.


## Deploy and test

Set the `cron.key` Google Cloud environment variables to a randomly generated key. This will be used to authorize requests coming from the 3rd-party cron service. For this use:

```bash
firebase functions:config:set cron.key="YOUR-KEY"
```

You can generate a random key, for instance, by running:

```bash
node -e "console.log(require('crypto').randomBytes(20).toString('hex'))"
```

To set up the sample:

 - Create a Firebase Project using the [Firebase Developer Console](https://console.firebase.google.com)
 - Download this sample e.g. `git clone https://github.com/firebase/functions-samples`
 - Enter the sample directory `cd functions-samples/delete-unused-accounts-cron`
 - Setup the sample with your project `firebase use --add` and follow the instructions.
 - Install node dependencies of your Functions `cd functions; npm install; cd -`
 - Deploy your project using `firebase deploy`.
 - Open an account with a 3rd party cron service (e.g. www.setcronjob.com, cron-job.org, www.easycron.com, [Zapier](https://zapier.com/zapbook/webhook/) ...) and setup a daily cron job to hit the URL (don't forget to change `<YOUR-KEY>` and `<PROJECT-ID>`):

 ```
 https://us-central1-<PROJECT-ID>.cloudfunctions.net/accountcleanup?key=<YOUR-KEY>
 ```
