# Text Moderation with Cloud Functions

This template shows how to perform server side moderation of text written to a Firebase DB.

For instance if a user added the message "I DON'T LIKE THIS APP!! This is POOP!!!" this will get moderated to a - more civilized - non uppercase message: "I don't like this app. This is ****".


## Functions Code

See file [functions/index.js](functions/index.js) for the moderation code.

Moderation of the messages is performed using [bad-words](https://www.npmjs.com/package/bad-words) a bad words remover that uses an external [list of bad-words](https://github.com/web-mech/badwords-list) and is currently mostly aimed at filtering english bad words. Also messages that contains mostly upper case characters are re-capitalized correctly using [capitalize-sentence](https://www.npmjs.com/package/capitalize-sentence).

The dependencies are listed in [functions/package.json](functions/package.json).


## Sample Database Structure

Users anonymously add a message - an object with a `text` attribute - to the `/messages` list:

```
/functions-project-12345
    /messages
        /key-123456
            text: "This is my first message!"
        /key-123457
            text: "IN THIS MESSAGE I AM SHOUTING!!!"
```

Once the function has ran on the newly added messages it adds two attributes. `sanitized` which is `true` if message has been looked at and `moderated` which is `true` if it was detected that the message contained offensive content and was modified:

```
/functions-project-12345
    /messages
        /key-123456
            text: "This is my first message!",
            sanitized: true,
            moderated: false
        /key-123457
            text: "In this message I am shouting."
            sanitized: true,
            moderated: true
```


## Trigger rules

The function triggers every time a message is modified. It exits if the message has already been moderated.


## Security Rules

The security rules only allow users to create message but not edit them afterwards. Also it does not allow users to set the `sanitized` value. Only the Cloud Function is allowed to modify `sanitized` by using an admin authorized reference.


## Deploy and test

This sample comes with a Function and web-based UI for testing the function. To configure it:

 1. Create a Firebase Project using the [Firebase Console](https://console.firebase.google.com).
 1. Clone or download this repo and open the `text-moderation` directory.
 1. You must have the Firebase CLI installed. If you don't have it install it with `npm install -g firebase-tools` and then configure it with `firebase login`.
 1. Configure the CLI locally by using `firebase use --add` and select your project in the list.
 1. Install dependencies locally by running: `cd functions; npm install; cd -`
 1. Deploy your project using `firebase deploy`
 1. Open the app using `firebase open hosting:site`, this will open a browser.
 1. Open the app and add messages to the message board. Try to ad bad words into your message and they should get moderated.
