# Shortens URLs automatically using the Google URL Shortener API.

This template shows how to shorten URLs automatically as they are added.

## Functions Code

See file [functions/index.js](functions/index.js) for the code.

This uses the [Google URL Shortener API](https://developers.google.com/url-shortener/).

The dependencies are listed in [functions/package.json](functions/package.json).

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

## Deploy and test
- Add your Firebase API key to firebase config:
    ```bash
    firebase functions:config:set keys.firebase_api=<YOUR FIREBASE API KEY>
    ```
