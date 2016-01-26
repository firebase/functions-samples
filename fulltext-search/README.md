# Full-text search via Algolia

This template shows how to enable full text search on firebase database elements by using an Algolia hosted search service.

## Cloud Function Code

See file [index.js](index.js) for the code.

The dependencies are listed in [package.json](package.json).

## Sample Database Structure

As an example we'll be using a simple logs database structure:

```
/functions-project-12345
    /logs
        /key-123456
            text: "User signed in."
        /key-123457
            text: "Error: Could not connect to Database"
```

## Trigger rules

Below is the trigger rule for the `addtobigquery` function making sure it's triggered when a new log entry is added.

```
  "functions": {
    ".source": "functions",
    "addtobigquery": {
      "triggers": {
        "database": {
          "path": "/logs/$logid"
        }
      }
    }
  }
```


