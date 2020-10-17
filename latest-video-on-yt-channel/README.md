# Get the latest video on the Youtube channel

This sample redirects to the latest video on a specific Youtube channel. You need to make `GET` request to this function and pass Youtube `channelID` as a query string. You can find how to get `channelID` [here](https://support.google.com/youtube/answer/3250431?hl=en).

## Why it can be useful?

Really, many influencers in the social networks use links to their latest video on Youtube and paste it manually. This Cloud Function can simplify this process.

## Requirements
- you need to enable Youtube API in Google Cloud Console and get an API key
- you need to set the `Blaze` plan for the Firebase project
- you must have the Firebase CLI installed. If you don't have it install it with `npm install -g firebase-tools`

## Run the sample

1. `git clone https://github.com/firebase/functions-samples.git`
2. `cd functions-samples/latest-video-on-yt-channel/`
3. `firebase login`
4. Setup your project by running `firebase use --add` and select the project you had created.
5. Set Youtube API key as an environment variable:
    ```bash
    firebase functions:config:set youtube.key="THE API KEY"
    ```
6. `cd functions/`
7. `npm install`
8. `firebase serve`
9. Go to the browser and paste function's link + `channelId`. For example:
    `http://localhost:5000/<project-id>/<region>/latestYoutubeVideo?channelId=<channelId>`

## Deploy and test

To test the sample:

1. Deploy your Cloud Functions using `firebase deploy --only functions`
2. Open a browser and paste the function's link with Youtube channel ID as a query parameter.
