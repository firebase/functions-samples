# Removing old items from a list

This sample shows how to remove child nodes older than 2 hours from a Firebase Database list. This can be useful for removing outdated items from a collection.

## Functions Code

See file [functions/index.js](functions/index.js) for the code.

Note that this code only runs when triggered by a write to the list. This means that if nothing gets written for a while, the list may still contain outdated items. If that does not match with your use-case, you should modify the code to trigger based on a time-interval as shown in [this sample](../delete-unused-accounts-cron).

The dependencies are listed in [functions/package.json](functions/package.json).

## Sample Database Structure

The example uses the database structure shown below: 

```
/functions-project-12345
    /path
        /to
            /items
                item1: {
                    timestamp: 1497911193083
                },
                item2: {
                    timestamp: 1597911193083                    
                }
                ...
```

The default cutoff interval is 2 hours, meaning that items older than 2 hours are deleted. You can modify the code to match your database structure and cutoff requirements.
