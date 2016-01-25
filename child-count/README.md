# Tracking the number of elements in a list

This template shows how to keep track of the number of elements in a Firebase Database list. This can be useful to keep tack of the number of "likes" or "followers" of a somethings shares through social media.

## Cloud Function Code

See file [index.js](index.js) for the code.

This is done by simply updating a `likes_count` attribute on the parent of the list node which is tracked.

The dependencies are listed in [package.json](package.json).

## Sample Database Structure

As an example we'll be using the database structure shown below. It keeps tracks of the list of users who liked an image and the count of these likes:

```
/functions-project-12345
    /images
        /key-123456
            likes_count: 32
            /likes 
                user123456: true
                user456789: true
                user786245: true
                ...
```

## Trigger rules

Below is the trigger rule for the `countlikes` function making sure it's triggered when a new like is added/removed.

```
  "functions": {
    ".source": "functions",
    "countlikes": {
      "triggers": {
        "database": {
          "path": "/images/$image/likes",
        }
      }
    }
  }
```


