# Google Assistant action that reads the ordinal of a number.

This sample shows how to create an action for the Google Home/Assistant using the Actions SDK hosted on Cloud Functions. The sample action asks users to say a number and reads out the ordinal of that number.

e.g. If the user says "Twelve" the action will say "The ordinal of twelve is twelfth".

Further reading:
 - Actions SDK: https://developers.google.com/actions/develop/sdk/getting-started#getting-started.
 - Firebase SDK: https://firebase.google.com/docs/functions

## Functions Code

See file [functions/index.js](functions/index.js) for the code.

Handling the Google Actions requests is done using the [Google Actions SDK](https://www.npmjs.com/package/actions-on-google).

The dependencies are listed in [functions/package.json](functions/package.json).


## Deploy and test

To test this sample action:

 - Create a Firebase Project using the [Firebase Developer Console](https://console.firebase.google.com)
 - Configure this sample to use your project using `firebase use --add` and select your project.
 - Deploy your project using `firebase deploy`
 - In the `action.json` file, update the two `<YOUR_PROJECT_ID>` placeholders with your Firebase project ID. The URL should match the `Function URL (sayNumber):` that was printed out by `firebase deploy`.
 - [Download](https://developers.google.com/actions/tools/gactions-cli) the `gaction` CLI
 - Make your action available for testing using the `gactions preview action.json`
 - Test your Action on the [Google Home Web Simulator](https://g.co/actionswebsim) by saying "Talk to My Action"
