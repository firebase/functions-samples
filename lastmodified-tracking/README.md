# Tracking last modified Date of a Firebase Database

This template shows how to keep track of the date at which the Firebase Database or a subset of a firebase Database was last modified.

## Cloud Function Code

See file [index.js](index.js) for the code.

This is done by simply updating a `lastmodified` attribute on the parent of the node which is tracked (for instance at the root of the Database).

## Sample Database Structure

As an example we'll be using a simple chat database structure:

```
/functions-project-12345
    /chat
        /key-123456
            username: "Mat"
            text: "Hey Bob!"
        /key-123457
            username: "Bob"
            text: "Hey Mat"
```

## Trigger rules

Below is the trigger rule for the `touch` function making sure it's triggered when a new chat message is added/modified.

```
  "functions": {
    ".source": "functions",
    "touch": {
      "triggers": {
        "database": {
          "path": "/chat/$message",
        }
      }
    }
  }
```

## Security Rules

The following security rules ensures only a Cloud Function with admin access can update the `lastmodified` attribute.

```
{
  "rules": {
    "lastmodified": {
        ".write": "false", // TODO: Check that this works with GCF admin access!
        ".read": "true"
    }
  }
}
```


