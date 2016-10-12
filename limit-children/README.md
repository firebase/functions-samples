# Limit number of child nodes

This template shows how to keep the number of child nodes in a Firebase database below a given number. This can be used to limit the number of lines of a chat history or logs.

## Functions Code

See file [functions/index.js](function/index.js) for the code.

The dependencies are listed in [functions/package.json](function/package.json).

## Sample Database Structure

As an example we'll be using a simple chat database structure:

```
/functions-project-12345
    /chat
        /key-123456
            user: "Mat",
            text: "Hey Bob!"
        /key-123457
            user: "Bob",
            text: "Hey Mat! What's Up?"
```

Every time a new chat message is added the Function runs. It counts the number of chat messages and removes the old ones if there are too many.