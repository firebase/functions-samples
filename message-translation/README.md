# Automatic message translation using the Google Translate API.

This template shows how to translate a new message in a given language into multiple destination languages.

## Functions Code

See file [functions/index.js](functions/index.js) for the code.

This is done by using the Google Translate API to translate the new message. The translated output is written into a fanned out structure using the langauge code as the key.

The dependencies are listed in [functions/package.json](functions/package.json).

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

When a new message is received we lookup the language message and automatically translate in all other required languages:

```
/functions-project-12345
    /messages
        /en
            /key-123456
                translated: true
                text: "Hey Bob! How Are you?"
            /key-123457
                translated: false
                text: "Hey Mat! How Are you?"
        /fr
            /key-123456
                translated: true
                text: "Salut Bob! Comment ca va?"
```
