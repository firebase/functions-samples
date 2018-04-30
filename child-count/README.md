# Tracking the number of elements in a list

This template shows how to keep track of the number of elements in a Firebase Database list. For instance this can be useful to keep track of the number of "likes" or "followers" of something shared on a social platform.

## Functions Code

See file [functions/index.js](functions/index.js) for the code.

This is done by updating a `likes_count` property on the parent of the list node which is tracked.

This counting is done in two cases:

1. When a like is added or deleted, the `likes_count` is incremented or decremented.
2. When the `likes_count` is deleted, all likes are recounted.

The dependencies are listed in [functions/package.json](functions/package.json).

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
