# Shortens URLs automatically using the Google URL Shortener API.

This template shows how to shorten URLs automatically as they are added.


## Functions Code

See file [functions/index.js](functions/index.js) for the code.

This uses the [Bit.ly API](https://dev.bitly.com/).

The dependencies are listed in [functions/package.json](functions/package.json).

## Setting up the sample

 - Create a Firebase project using the [Firebase Console](https://console.firebase.google.com).
 - Create a [Bit.ly application](https://bitly.com/a/oauth_apps) and generate an **Access Tokens**.
 - Set the sample ot use your Firebase project using `firebase use --add` and select your new Firebase project.
 - Set your Bit.ly app's access token on your function by running:
     ```bash
     firebase functions:config:set bitly.access_token=XXXXXXXXXXXXX
     ```
 - Deploy the function using `firebase deploy`
 - Manually add an object to the Realtime Database following the structure described below.


## Sample Database Structure

We'll be using a simple database structure:

```
/functions-project-12345
    /links
        link-123456: "https://my.super.long-link.com/api/user/profile/-jEHitne10395-k3593085"
```

When a new URL (string) is pushed to `/links`, it gets replaced with an object containing the original URL and a shortened one.
This way, you can display a clean URL by fetching `/links/$linkId/short`.

```
/functions-project-12345
    /links
        /link-123456
            original: "https://my.super.long-link.com/api/user/profile/-jEHitne10395-k3593085",
            short: "https://goo.gl/EKDdza"
```
