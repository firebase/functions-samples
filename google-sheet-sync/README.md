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

 1. Create a Firebase project on the [Firebase Console](https://console.firebase.google.com) and visit the **Storage** tab.
 1. Clone this repo: `git clone https://github.com/firebase/functions-samples`.
 1. Open this sample's directory: `cd functions-samples/google-sheet-sync`
 1. Setup your project by running `firebase use --add` and select the project you had created.
 1. Install dependencies in the functions directory: `cd functions; npm install; cd -`
 1. Using the Google APIs Console [create an OAuth Client ID](https://console.cloud.google.com/apis/credentials/oauthclient?project=_) Click this link, select your project and then choose **Web Application**. In **Authorized redirect URIs**, you’ll need to enter `https://{YOUR-PROJECT-ID}.firebaseapp.com/oauthcallback`.
 1. Use `firebase functions:config:set` to configure your Google API client ID and secret by running:
    ```bash
    firebase functions:config:set googleapi.client_id="YOUR_CLIENT_ID" googleapi.client_secret="YOUR_CLIENT_SECRET"
    ```
 1. Create a new Google Sheet, and copy the long string in the middle of the Sheet URL. This is the Spreadsheet ID.
 1. Use `firebase functions:config:set` to configure your Google Spreadsheet ID by running:
    ```bash
    firebase functions:config:set googleapi.sheet_id="YOUR_SPREADSHEET_ID"
    ```
 1. Use `firebase functions:config:set` to configure your Google Spreadsheet ID by running:
    ```bash
    firebase functions:config:set watchedpaths.data_path="THE_DATA_PATH_YOU_WANT"
    ```
 1. Deploy your project using `firebase deploy`
 1. Configure the app once by opening the following URL and going through the auth flow `https://{YOUR-PROJET-ID}.firebaseapp.com/authgoogleapi`
 1. To test, go to `{YOUR_PROJET_ID}.firebaseapp.com/testsheetwrite`. This will automatically add some test data in your Firebase Realtime Database in the data path that you set in `watchedpaths.data_path`.
 1. Check your Google Sheet, to see these same values which have been appended via the trigger function.
