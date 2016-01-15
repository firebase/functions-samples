# Text Moderation with Firebase Cloud Functions

This template shows how to perform server side moderation of text written to a Firebase DB.

For instance if a user added the message "I DON'T LIKE THIS APP!! This is POOP!!!" this will get moderated to a - more civilized - non uppercase message: "I don't like this app. This is ****".

## Cloud Function Code

See file [index.js](index.js) and [moderation-string-utils.js](moderation-string-utils.js) for the moderation code.

Moderation of the messages is performed using [bad-words](https://www.npmjs.com/package/bad-words) a bad words remover that uses an external [list of bad-words](https://github.com/web-mech/badwords-list) and is currently mostly aimed at filtering english bad words. Also messages that contains mostly upper case characters are re-capitalized correctly using [capitalize-sentence](https://www.npmjs.com/package/capitalize-sentence).

The dependencies are listed in [package.json](package.json).

## Sample Database Structure

Users anonymously add a message text to the `/messages` list:

```
/functions-project-12345
    /messages
        /key-123456
            text: "This is my first message!"
        /key-123457
            text: "This is my second message!"
```

## Trigger rules

Below is the trigger rule for the `moderator` function making sure it's triggered only when a new message is created and not every time it's updated.

```
  "functions": {
    ".source": "functions",
    "moderator": {
      "triggers": {
        "database": {
          "path": "/messages/$message",
          "condition": "!data.exists()" // Only run the function once on new messages
        }
      }
    }
  }
```

## Security Rules

The following security rules ensures users cannot read a message before it has been sanitized. The function adds a `sanitize` attribute (boolean) to the messages once they have been moderated.
Also we make sure that users can only create a message and not edit them. We also make sure they cannot set the sanitized flag already.

```
{
  "rules": {
    "messages": {
      "$message": {
        // Users can only add new messages. Not modify or delete them. Also makes sure they cannot mark a message as
        // already sanitized.
        ".write": "!data.exists() && !newData.child('sanitized').exists()'"
        ".read": "data.child('sanitized').val() === true"
      }
    }
  }
}
```


