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


## Trigger rules

The function triggers on changes to `/posts/{postid}/likes/{likeid}`.


## Setting up the sample

 1. Create a Firebase Project using the [Firebase Console](https://console.firebase.google.com).
 1. Enable the **Google** Provider in the **Auth** section.
 1. Clone or download this repo and open the `child-count` directory.
 1. You must have the Firebase CLI installed. If you don't have it install it with `npm install -g firebase-tools` and then configure it with `firebase login`.
 1. Configure the CLI locally by using `firebase use --add` and select your project in the list.
 1. Install dependencies locally by running: `cd functions; npm install; cd -`.
 1. Good to go now.
