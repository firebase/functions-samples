# Use Dialogflow with Functions

This sample shows how to use Dialogflow with firebase functions. Dialogflow is a tool used to build conversational user interfaces on applications and devices. (see www.dialogflow.com)

## Functions Code

See file [functions/index.js](functions/index.js) for the code.

This is done exactly as demonstrated on https://github.com/googleapis/nodejs-dialogflow.

The dependencies are listed in [functions/package.json](functions/package.json).

## Sample Database Structure

As an example we'll be using the database structure shown below. It keeps tracks of the list of conversations with the dialogflow agent:

```
/functions-project-12345
    /conversations
        /conversation-id-12345
            /messages
                /message-id-12345
                    text: "Hey"
                    sender: "user"
                /message-id-23456
                    text: "Hey there"
                    sender: "bot"
                    ...
```

## Modifications

You can modify the code after line #35 and use dialogflow like you would in a local nodejs environment.
