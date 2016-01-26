# Full-text search via Algolia

This template shows how to enable full text search on firebase database elements by using an Algolia hosted search service.

## Cloud Function Code

See file [index.js](index.js) for the code.

The dependencies are listed in [package.json](package.json).

## Sample Database Structure

As an example we'll be using a simple blog structure:

```
/functions-project-12345
    /blog-posts
        /key-123456
            text: "This is my first blog entry..."
        /key-123457
            text: "This is my second blog entry..."
    /search
        /queries
            /key-546789
                query: "first entry"
            /key-078234
                query: "second entry"
        /results
            /key-546789
                result: "first entry"
            /key-078234
                result: "second entry"
```

## Trigger rules

Below is the trigger rule for the `indexentry` function making sure it's triggered when a new log entry is added and for the `searchentry` function making sure it's triggered when a new search query is added.

```
  "functions": {
    ".source": "functions",
    "indexentry": {
      "triggers": {
        "database": {
          "path": "/blog-posts/$blogid"
        }
      }
    }
    "searchentry": {
      "triggers": {
        "database": {
          "path": "/search/queries/$queryid"
        }
      }
    }
  }
```


