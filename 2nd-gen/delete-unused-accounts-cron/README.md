# Periodically delete unused accounts

This sample demonstrates how to delete the accounts of users who have not signed-in in the last month.


## Functions Code

See the file [functions/index.js](functions/index.js) for the code.

**Note:** This function uses Cloud Scheduler, which can have associated costs. Your project must be on the Blaze payment plan as these features require billing information. See the [Cloud Scheduler pricing page](https://cloud.google.com/scheduler/pricing) for more information.

The dependencies are listed in [functions/package.json](functions/package.json).

## Deploy and test

To set up the sample:

 - Create a Firebase Project using the [Firebase Developer Console](https://console.firebase.google.com)
 - Download this sample e.g. `git clone https://github.com/firebase/functions-samples`
 - Enter the sample directory `cd functions-samples/2nd-gen/delete-unused-accounts-cron`
 - Setup the sample with your project `firebase use --add` and follow the instructions.
 - Install node dependencies of your Functions `cd functions; npm install; cd -`
 - Deploy your project using `firebase deploy`.
 - The Cloud Scheduler job should then run once a day and delete any inactive users. You can manually run the task by [navigating to Cloud Scheduler in the Google Cloud Platform Console](https://console.cloud.google.com/cloudscheduler).