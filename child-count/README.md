# Tracking the number of elements in a list

This template shows how to keep track of the number of elements in a Firebase Database list. For instance this can be useful to keep tack of the number of "likes" or "followers" of something shared on a social platform.

## Functions Code

See file [index.js](functions/index.js) for the code.

This is done by simply updating a `likes_count` attribute on the parent of the list node which is tracked.

The dependencies are listed in [package.json](package.json).

## Sample Database Structure

As an example we'll be using the database structure shown below. It keeps tracks of the list of users who liked a post and the count of these likes:

```
/functions-project-12345
    /posts
        /key-123456
            likes_count: 32
            /likes 
                user123456: true
                user456789: true
                user786245: true
                ...
```
