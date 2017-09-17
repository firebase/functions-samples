# Wipeout user data when account deleted

To be compliant with privacy regulations you may need to ensure that a
user's data is deleted when they delete their account.

This library contains a Cloud Function triggered by account deletion.
It wipes out all the data in the Firebase Realtime Database that
belongs to the user that was deleted.

To determine "belonging", the Cloud Function analyzes the app's
Security Rules, considering any data that can only be written by a
particular user to belong to that user.

Also included here is a simple demo app showing how the library works.

The instructions below explain how to *use* this library. If you want
to *contribute* to the library, or are just curious about how it is
built, please see the overview [Design Doc](doc/design.md) and the
detailed explanation of [Auto Rules
Extraction](doc/auto_rules_extraction.md).


## Functions Code

See file [functions/wipeout.js](functions/wipeout.js) for the data cleanup code.

When a user deletes their account, their data in the database will be deleted
automatically. The function needs configuration to find according user data.
The configuration can be specified in local file
[functions/wipeout_config.json](functions/wipeout_conifg.json). If the file
doesn't exists or doesn't contain a valid configuration object, the function
will go ahead and infer the configuration from Firebase database authorization
rules (verification of the inferred rules will be in the next release).

The configuration is a json object and its `wipeout` filed is a list of objects.
Each object in the list has a string field called `path` specifying a path where
user data is stored. The path string could use variable `$WIPEOUT_UID` which
will be replaced by UID of the deleted user account when triggered.

Please don't change the `WIPEOUT_CONFIG` object in `functions/index.js` unless
you want to customize the function and know the code well.

The dependencies are listed in [functions/package.json](functions/package.json).


## Sample Database Structure

When a user signs-in we write some sample personal data of the following form:

```
/functions-project-12345
    /users
        $uid : "Some user data"
```

When the user delete their account a Function will trigger and automatically
delete the corresponding user data in the realtime database.

## Trigger rules

The function triggers on user account deletions. While a developer confirmation
is needed before the trigger stats to work, see step 9 in Deploy and test for
details.


## Deploy and test

This sample comes with a Function and web-based UI for testing the function.
To configure it:

 1. Create a Firebase Project using the
  [Firebase Console](https://console.firebase.google.com).
 1. Enable Google Auth. In the Firebase Console open the
  **Authentication** section > **SIGN IN METHOD** tab
  you need to enable the **Google** Sign-in Provider and click **SAVE**.
 1. Clone or download this repo and open the `user-data-cleanup` directory.
 1. You must have the Firebase CLI installed. If you don't have it install it
  with `npm install -g firebase-tools` and then configure it with
  `firebase login`.
 1. Configure the CLI locally by using `firebase use --add` and select 
 your project in the list.
 1. Install dependencies locally by running: `cd functions; npm install; cd -`
 1. Run local tests using `cd functions; npm test`
 1. Deploy your project using `firebase deploy`
 1. Initialized the library `npm start <project-id>`. If you don't know your
    project ID, run `firebase list` and look for the row with `(current)` by the
    name.
 1. Please go to the url
  `https://us-central1-<project-id>.cloudfunctions.net/showWipeoutConfig` to
  verify the wipeout rules. The webpage will show the source of these wipeout
  rules, either loaded from local config or generated from security rules.
1. The format of wipeout rules are described in the next section. If the rules
  are correct, click the confirm button, or else change the local configuration
  file [functions/wipeout_config.json](functions/wipeout_conifg.json) and
  redeploy. **Note a developer confirmation is required after every
  deployment.**
 1. Open the app using `firebase open hosting:site`, this will open a browser.
 1. Sign in using Google Sign-In and delete the account using
  the provided button. You can check at each step of the way if the data
  has been deleted using the Firebase console.
 
## Understanding the wipeout rules

The wipepout rules is a list of JSON object, each of them describes a pattern of
user data storage. When a user account is deleted, the library go through every
config to remove any match with these patterns. A sinlge config rule can have
four fields:
*   `path`: Mandatory field. A String indicating a location of user data. A path
    can include place holder variables `#WIPEOUT_UID` which will be replaced by
    `auth.uid` at execution time. It can also include free variables which
    starts with `$`. A simple example `path` is `/users/#WIPEOUT_UID`, and an
    example `path` field for a chat app is `/chat/$room`.
*   `authVar`: Optional field, List of data references. Besides the locations
    marked by `#WIPEOUT_UID` in `path`, authVar is a list of values/data
    references which should equals to the authentication uid. For example, the
    previous chat app example could have `authVar:
    ['val(rules,chat,$room,creator)']`(see data reference below for format
    details). This will restrict the free variable `$room` to the set of chat
    rooms created by the user who just deleted the account because it requires
    data at `/chat/$room/creator` to be `auth.uid`.
*   `condition`: Optional field, string. Any additional restriction on the path
    which is not related to authentication. Logic `&&` and `||` supported, free
    variable not supported. An example condition: `#WIPTOUT_UID !== someID &&
    val(rules,user,#WIPEOUT_UID,creatYear) > 2016`.
*   `except`: Optional field. Subpath which doesn't belong to a single user,
    shouldn't be removed at account deletion. For example, shared data under a
    user data folder. Currently only subpaths which are one level deeper than
    its parent path is supported. An example `except` for `/chat/$room/` is
    `/chat/$room/members`.

Data reference: A string representing the value or existence of data at a
location in the database. The string format is a call of `val()` or `exists()`,
and the list of arguments stands for the path to the location. The root of the
path is always 'rules'. e.g. `val(rules,chat,$room,creator)` stands for the
value at location `/chat/$room/creator`.

At execution time, a config will go through the following process to get a set
of materialized absolute paths in the database:
1.  Swap `#WIPEOUT_UID` place holder with `auth.uid` of deleted account.
1.  Evaluate condition, filter out any config with a false condition.
1.  Evaluate authVar, retrieve values for variables in path.
1.  Evaluate exception,
1.  Remove any remaining trailing free variables since they represent wildcard
    values in paths. After the removal, any path which still have free variable
    is not supported for deletion and will be ignored.

After these steps, we'll have a list of concrete deletion path. The library goes
ahead and deletes the data and record the the paths together with a timestamp at
`/wipeout/history/#WIPEOUT_UID` in the realtime database.
