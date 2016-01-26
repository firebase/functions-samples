# Automatic message translation using the Google Translate API.

This template shows how to translate a new message in a given language into multiple destination languages.

## Cloud Function Code

See file [index.js](index.js) for the code.

This is done by using the Google Translate API to translate the new message. The translated output is written into a fanned out structure using the langauge code as the key.

The dependencies are listed in [package.json](package.json).

## Sample Database Structure

As an example we'll be using a simple database structure:

```
/functions-project-12345
    /messages
        /en
            /key-123456
                translated: false
                text: "Hey Bob! How Are you?"
            /key-123457
                translated: false
                text: "Hey Mat! How Are you?"
```

## Trigger rules

Below is the trigger rule for the `translate` function making sure it's triggered when a new message is added.

```
  "functions": {
    ".source": "functions",
    "translate": {
      "triggers": {
        "database": {
          "path": "/messages/$languageID/$messageID",
          "condition": "newData.child('translated').val() === false"
        }
      }
    }
  }
```


