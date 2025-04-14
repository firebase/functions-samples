# Tracking last modified Date of a Firebase Database

This template shows how to keep track of the date at which the Firebase Database or a subset of a firebase Database was last modified.

## Functions Code

See file [functions/index.js](functions/index.js) for the code.

This is done by simply updating a `lastmodified` attribute on the parent of the node which is tracked (for instance at the root of the Database).

The dependencies are listed in [functions/package.json](functions/package.json).

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

The function will write to `/lastmodified`:

```
/functions-project-12345
    /lastmodified: 1234567890
    /chat
        /key-123456
            username: "Mat"
            text: "Hey Bob!"
        /key-123457
            username: "Bob"
            text: "Hey Mat"
```

## Security Rules

The following security rules ensures only a Function with admin access can update the `lastmodified` attribute.

```
{
  "rules": {
    "lastmodified": {
        ".write": "false",
        ".read": "true"
    }
  }
}
```
