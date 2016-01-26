# Limit number of child nodes.

This template shows how to keep the number of child nodes in a Firebase database below a given number. This can be used to limit the number of lines of a chat history or logs.

## Cloud Function Code

See file [index.js](index.js) for the code.

The dependencies are listed in [package.json](package.json).

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

## Trigger rules

Below is the trigger rule for the `truncate` function making sure it's triggered when a new message is added.

```
  "functions": {
    ".source": "functions",
    "truncate": {
      "triggers": {
        "database": {
          "path": "/chat/$messageid"
        }
      }
    }
  }
```


