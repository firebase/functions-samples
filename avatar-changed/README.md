# Tracking the number of elements in a list
Function that triggers user firestore
and after the user has changed avatar id, the function checks: that such an id is in the user's photo collection or a non-empty id is set, otherwise it changes to the previous identifier

## Functions Code

See file [functions/index.js](functions/index.js) for the code.

The dependencies are listed in [functions/package.json](functions/package.json).

## Sample Database Structure

As an example, we will use the database structure shown below. It tracks the user’s avatarID change

```
/User
    /{userId}
        /
        avatar: avatarID
        
```
/User_Photos
    /{userId}
        /photos
            /{photoID}
                /avatar: Bool
