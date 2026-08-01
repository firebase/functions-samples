# YouTube: Get information about a YouTube channel (2nd Gen)

This quickstart demonstrates how to query the
[YouTube Data API](https://developers.google.com/youtube/v3) using **Cloud
Functions for Firebase (2nd Gen)** with an HTTPS trigger.

## Introduction

The function `getChannelInfo` returns information about a Youtube channel. By
default it will return information about the
[Firebase YouTube channel](https://www.youtube.com/user/Firebase), but you can pass it a
`channelId` URL Query parameter to query any channel you'd like.

## Setup

### Get a YouTube API Key

1. Create a Firebase Project on the
   [Firebase Console](https://console.firebase.google.com) if you don't already have a project you want to use.
   1. Upgrade your Firebase project to the
      [Blaze "pay as you go" plan](https://firebase.google.com/pricing)
1. Enable the Youtube API by visiting the
   [API console](http://console.cloud.google.com/marketplace/product/google/youtube.googleapis.com),
   selecting your Firebase project, and clicking "ENABLE".
   1. Once the API is enabled, visit the
      [credentials tab](http.console.cloud.google.com/apis/api/youtube.googleapis.com/credentials)
      and click "CREATE CREDENTIALS" to create a YouTube API key.

### Clone and configure the function

1. Install the Firebase CLI and log in:
   ```
   npm install --global firebase-tools

   firebase login
   ```
1. Clone or download this repo and open the `Node/youtube` directory.
1. `cd` into the `functions` directory and install dependencies with `pnpm install`
1. Set up your Firebase project by running `firebase use --add` with the
   Firebase CLI, select your Project ID and follow the instructions.
1. Set the YouTube API key as a secret:
    ```bash
    firebase functions:secrets:set YOUTUBE_API_KEY
    ```
   When prompted, enter the API key you created.

### Run your function locally with the Firebase Emulator Suite

1. Start the emulator:
    ```bash
    firebase emulators:start --only functions
    ```
1. Check the emulator output to find the URL of the `getChannelInfo` function. It will looks something like `http://localhost:5001/my-project-id/us-central1/getChannelInfo`
1. Via CURL or in your browser, visit the URL that the function is running at. Optionally, add a query string `?channelId=SOME_CHANNEL_ID` to the end of the URL.
1. You should get a JSON response with information about the YouTube channel!


## Deploy the app to prod

Deploy to Firebase using the following command:

```bash
firebase deploy
```

This deploys and activates the `getChannelInfo` function.

> The first time you call `firebase deploy` on a new project with Functions will take longer than usual.

## Modify it to your needs

Now that you've got this sample working, modify it to work for your use case! Some ideas:

- Check out the other things you can query with the [YouTube Data API](https://developers.google.com/youtube/v3/docs)
- Convert `getChannelInfo` function to a scheduled function, and write the new latest videos for a channel into Firestore or Realtime Database
- ...anything else you can think of!
