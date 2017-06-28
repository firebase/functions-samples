# Automatically sync data to a Google Sheet

This sample demonstrates how to sync new data written to a Firebase database to a Google Sheet. It includes a method for obtaining, storing, and using Oauth2 tokens for Google API access.

This code is also described in this [blog post](https://medium.com/@elon.danziger/fast-flexible-and-free-visualizing-newborn-health-data-with-firebase-nodejs-and-google-sheets-1f73465a18bc).


## Functions Code

See file [functions/index.js](functions/index.js) for the Google Sheet sync code.

Use the HTTPS function `authGoogleAPI` to request Oauth2 tokens for the Google API.

The trigger function is `appendRecordToSpreadsheet`.

To test it out, use the HTTPS function `testSheetWrite`.


## Trigger rules

The function triggers on when data is added to the DATA_PATH of the active Firebase database.  In this sample, objects written to `DATA_PATH/{ID}` in the form `{firstColumn: value, secondColumn: value, thirdColumn: value}` are appended to the sheet.


## Deploy and test

To deploy and test the sample:

 - Create a Firebase project on the [Firebase Console](https://console.firebase.google.com) and visit the **Storage** tab.
 - Clone this repo: `git clone https://github.com/firebase/functions-samples`.
 - Open this sample's directory: `cd functions-samples/google-sheet-sync`
 - Setup your project by running `firebase use --add` and select the project you had created.
 - Install dependencies in the functions directory: `cd functions; npm install; cd -`
 - Go to the [Google APIs API Manager](https://console.developers.google.com/apis/credentials), click *Create Credentials*, then *Oauth client ID*, then Web Application. In authorized redirect URIs, you’ll need to enter `{YOUR-FUNCTIONS-SUBDOMAIN}.cloudfunctions.net/Oauthcallback`.
 - Update `FUNCTIONS_REDIRECT` in `index.js` to this same URL.
 - Use `firebase functions:config:set` to configure your Google API client ID and secret.
 - Create a new Google Sheet, and copy the long string in the middle of the Sheet URL.
 - Update `SHEET_ID` in `index.js` to this value.
 - Deploy your project using `firebase deploy`
 - To test, go to `{YOUR-FUNCTIONS-SUBDOMAIN}.cloudfunctions.net/testSheetWrite`.
 - Check your Firebase database for a new object in `/testing`.  Check your Google Sheet, to see these same values which have been appended via the trigger function.
