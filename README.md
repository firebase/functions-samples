# Cloud Functions for Firebase Sample Library

This repository contains a collection of samples showcasing some typical uses of [Cloud Functions for Firebase](https://firebase.google.com/features/functions).

> All samples use the Node 16 runtime and require the Blaze pay-as-you-go billing plan to deploy. Learn more about Cloud Functions for Firebase's Node versions [here](https://firebase.google.com/docs/functions/manage-functions#set_nodejs_version).

### What's Cloud Functions for Firebase?

Cloud Functions is a hosted, private, and scalable Node.js environment where you can run JavaScript code. [Cloud Functions for Firebase](https://firebase.google.com/features/functions) integrates the Firebase platform by letting you write code that responds to events and invokes functionality exposed by other Firebase features.

## Prerequisites

To learn how to get started with Cloud Functions for Firebase by having a look at our [Getting Started Guide](https://firebase.google.com/docs/functions/get-started), trying the [quickstart samples](/quickstarts) and looking at [the documentation](https://firebase.google.com/docs/functions).


## Samples Overview

This repository contains a few categories of samples:

 1. [**Quickstarts**](#quickstarts) are minimal examples for each types of triggers.
 1. [**Cloud Functions v2 public preview**](#v2) samples show how to use the public preview of [Cloud Functions for Firebase v2](https://firebase.google.com/docs/functions/beta).
 1. [**Development Environment Samples and Boilerplates**](#environment) illustrates how to get started with
different, commonly used JavaScript development patterns such as Typescript, React SSR, and ES2017.
 1. [**Image Processing**](#image) shows a few ways you can process and transform images using Cloud Functions such as generating thumbnails, converting images extracting metadata...
 1. [**Firebase Realtime Database Data Consistency**](#rtdb) shows how to implement automatic data consistency such as keeping a count of children, having a max amount of node childs, cleaning up old data etc... for your Realtime Database.
 1. [**Other common usecases**](#other) a set of other common usecases for Cloud Functions.


<a name="quickstarts"></a>
## Quickstarts

Here is a set of minimal samples for each Cloud Functions trigger types.

### Quickstart: Uppercaser for [Realtime Database](/quickstarts/uppercase) or [Firestore](/quickstarts/uppercase-firestore)

This quickstart sample demonstrates using **Cloud Functions** triggered by **Firebase Realtime Database or Firestore events**. The function transforms message text written to Firestore to uppercase.

### [HTTPS trigger quickstart: Time Server](/quickstarts/time-server)

This quickstart sample demonstrates using **Cloud Functions** triggered by **HTTPS requests**. The function returns the current server time and allows for date time formatting.

### [Hosting triggered HTTPS function quickstart: Big Ben](/quickstarts/big-ben)

This quickstart demonstrates using **Cloud Functions** with an HTTPS trigger that's triggered through a Firebase Hosting URL. The function will display a repeated number of "BONG"s depending on the hour of the day.

### [Cloud Storage trigger quickstart: Thumbnail generator](/quickstarts/thumbnails)

This quickstart sample demonstrates using **Cloud Functions** triggered by **Firebase Storage events**. The function generates a thumbnail of uploaded images.

### [Auth trigger quickstart: Welcome Email](/quickstarts/email-users)

This quickstart sample demonstrates using **Cloud Functions** triggered by **Firebase Auth events**. The function sends a Welcome Email when user accounts are created (or when users sign-in using an Identity Provider for the first time) and sends a Goodbye Email when user accounts are deleted.

### [PubSub trigger quickstart: Hello World](/quickstarts/pubsub-helloworld)

This quickstart sample demonstrates using **Cloud Functions** triggered by **PubSub events**. The functions log the PubSub payload in a Hello world message.

### [Test Lab trigger quickstart: Log when a matrix completes](/quickstarts/test-complete)

This quickstart demonstrates how to trigger a function in response to the
completion of a test matrix in **Firebase Test Lab**.

<a name="v2"></a>
## Cloud Functions v2 public preview

> Note: Cloud Functions for Firebase v2 is a public preview. This means that the functionality might change in backward-incompatible ways. A preview release is not subject to any SLA or deprecation policy and may receive limited or no support.

See [the Firebase docs](https://firebase.google.com/docs/functions/beta) for more information about the v2 public preview.

### [HTTPS: Time Server](/2nd-gen/time-server/)

A minimal HTTPS example.

### [Task Queues: Back-up images from an API](/2nd-gen/taskqueues-backup-images/)

See how to use Task Queues to meter traffic to a rate-limited API.

### [Firebase Alerts: Send crash reports to Discord](/2nd-gen/alerts-to-discord/)

Trigger a function based on a Firebase Alert, and send information about the alert to a channel in a Discord server.

### [Custom Events: Save image metadata](/2nd-gen/custom-events/)

Learn how to trigger a function based on an event sent by an extension

### [Callables: Add numbers and sanitize text](/2nd-gen/callable-functions/)

See how to write a v2 function that can easily be triggered from an app.

### [PubSub: Hello world](/2nd-gen/pubsub-helloworld/)

A minimal PubSub example.

### [Storage: Generate image thumbnails](/2nd-gen/thumbnails/)

Resize images after they're added to a Storage bucket.

### Unit testing

- [Test with Jest](/2nd-gen/test-functions-jest/)
    - [Test with Jest and TypeScript](/2nd-gen/test-functions-jest-ts/)
- [Test with Mocha](/2nd-gen/test-functions-mocha/)

<a name="environment"></a>
## Development Boilerplates

The Firebase CLI generates sample code for Cloud Functions using JavaScript or TypeScript.

### [Server-side generated pages w/ Handlebars templating and user sessions](/template-handlebars)

This sample shows how to serve server-side generated HTML pages using the [HandlebarsJs](http://handlebarsjs.com/) templating system and serve user-specific content by always passing the Firebase ID token in a `__session` cookie.

<a name="image"></a>
## Image Processing

Here are a few samples that show how you can process or analyze images using Cloud Functions.

### [Image Maker](/image-maker)
This sample demonstrates how to create various customized images such as sparkline or sphere charts through Cloud Functions and Hosting and serve it to the client.
Uses an HTTP trigger.

### [Convert images after upload](/convert-images)

Demonstrates how to automatically convert images that are uploaded to Firebase Storage to JPEG using ImageMagick.
Uses a Firebase Storage trigger.

### [Generate image thumbnails using Node.js Stream & Sharp](/image-sharp)

Demonstrates how to use Node.js Stream to read image from Cloud Storage, generate a thumbnail image using Sharp and upload it back to Cloud Storage.
Uses a Firebase Storage trigger.

### [Moderate offensive images](/moderate-images)

Demonstrates how to automatically moderate offensive images that are uploaded to Firebase Storage by using the Google Cloud Vision API to detect offensive images and ImageMagick to blur these images.
Uses a Firebase Storage trigger.

### [Extract image metadata](/exif-images)

Demonstrates how to automatically extract image's metadata using ImageMagick for images that are uploaded to Firebase Storage.
Uses a Firebase Storage trigger.


<a name="rtdb"></a>
## Firebase Realtime Database Data Consistency

These samples show how to implement automatic data consistency such as keeping a count of children, having a max amount of node childs, cleaning up old data etc...

### [LastModified Firebase Database tracking](/lastmodified-tracking)

Tracking when the Firebase Database (or a subset) was last modified.
Uses a Realtime Database trigger.

### [Firebase Database child nodes count](/child-count)

Keeps track of the number of child nodes of a Firebase Database element allowing clients to filter or order results using the child count.
This can be useful to keep track of the number of "likes" or "followers" of something shared through social media.
Uses a Realtime Database trigger.

### [Limit number of child nodes](/limit-children)

Makes sure that the number of child nodes stays below a certain threshold. This can be useful to limit the number of lines of logs or chat history below a given number.
Uses a Realtime Database trigger.

### [Removing old items from a list](/delete-old-child-nodes)

This sample shows how to remove child nodes older than 2 hours from a Firebase Database list. This can be useful for removing outdated items from a collection.
Uses a Realtime Database trigger.


<a name="other"></a>
## Solve other common use cases

### [Send FCM notifications](fcm-notifications)

This sample demonstrates how to send a Firebase Cloud Messaging (FCM) notification from a Realtime Database triggered Function when users get new followers. The sample also features a Web UI to experience the FCM notification.
Uses a Realtime Database trigger.

### [Google Assistant says ordinal of given number](/assistant-say-number)

This sample shows how to create an action for the Google Home/Assistant using the Actions SDK hosted on Cloud Functions. The sample action asks users to say a number and reads out the ordinal of that number.
Uses an HTTP trigger.

### [Authenticated JSON API](/authenticated-json-api)

This sample shows how to authenticate access to a JSON API to only allow access to data for a specific Firebase user.
Uses an HTTP trigger.

### [Authorized HTTP endpoint](/authorized-https-endpoint)

This sample shows how to restrict an HTTPS Function to only the Firebase users of your app.
Only users who pass a valid Firebase ID token as a Bearer token in the `Authorization` header of the HTTP request or in a `__session` cookie are authorized to use the function.
Checking the ID token is done with an ExpressJs middleware that also passes the decoded ID token in the Express request object.
Uses an HTTP trigger.

### Authorize with [Okta](/okta-auth), [LinkedIn](/linkedin-auth), [Spotify](spotify-auth), [Instagram](/instagram-auth), or [Basic Auth](/username-password-auth)

Demonstrates how to authorize with a 3rd party sign-in mechanism, create a Firebase custom auth token, update the user's profile and authorize Firebase.
Uses an HTTP trigger.

### [Post GitHub commits to Slack channel](/github-to-slack)

Demonstrates how to automatically post GitHub commits to a Slack channel using an HTTPS triggered Function.

### Create and charge customers with [Stripe](/stripe) or [Paypal](/paypal)

Demonstrates hows to integrate Firebase Auth and the Realtime database with Stripe via the Stripe Node.js library and shows how to create HTTP endpoints to charge customers via Paypal.

### [Text moderation](/text-moderation)

Demonstrates how to moderate user input text for bad words. This can be used to moderate usernames, chat or forum messages.
Uses a Realtime Database trigger.

### [Email confirmation](/email-confirmation)

Sends email confirmation after users subscribed to a mailing list.
Uses a Realtime Database trigger.

### [Automatic message translation](/message-translation)

Integrates the Google Translate API to perform automatic text translation across any number of languages. Language codes can be stored in Firebase for on the fly changes.
Uses a Realtime Database trigger.

### [Automatic URL shortener](/url-shortener)

Integrates the Bit.ly API to shorten URLs automatically as they are added to the database.
Uses a Realtime Database trigger.

### Full-text search for [Realtime Database](/fulltext-search) or [Firestore](/fulltext-search-firestore)

Enable full-text search on Firebase Database data or Firestore documents by using a hosted search service.
Uses a Realtime Database or Firestore trigger.

### [User data cleanup](/user-data-cleanup)

Deletes all associated user data in the Realtime database when a user deletes his Firebase account.
Uses an Auth trigger.
**This code has moved to its own repo at
https://github.com/firebase/user-data-protection**

### [Export your data to a Google Spreadsheet](google-sheet-sync)

This sample demonstrates how to sync new data written to a Firebase database to a Google Sheet. It includes a method for obtaining, storing, and using Oauth2 tokens for Google API access.
Uses HTTPS triggers and Realtime Database triggers.

### [Export your data to Big Query](/bigquery-import)

Copies Firebase Database elements into BigQuery automatically. This can be useful for instance for further logs analysis.
Uses a Realtime Database trigger.

### [Webhook upon Firebase Database writes](/minimal-webhook)

Writing to the Firebase Database triggers a request to a callback URL (a Webhook). The content of the modified Data is sent to the Webhook.
Uses a Realtime Database trigger.

### [Send a survey when users update your app](/survey-app-update)

This sample shows how to send a survey to your users who have updated your app. App Update is detected using a Firebase Analytics event.
Uses an Analytics trigger.

### [Send a coupon to user who have completed a purchase](/coupon-on-purchase)

This sample shows how to send a coupon to your users who have just purchased something. 10% off on your next purchase!
Uses an Analytics trigger.

### [Delete inactive users accounts via cron](/delete-unused-accounts-cron)

Periodically deletes the accounts of users who have not signed in in the last month.
Uses an HTTPS trigger.

### [Developer Motivator](/developer-motivator)

This sample demonstrates how to send a Firebase Cloud Messaging (FCM) notification to the developer device each time your app gains or loses a user.
Uses an Analytics trigger.

### [Audio Files Conversion](/ffmpeg-convert-audio)

This sample uses ffmpeg / fluent-ffmpeg and automatically converts audio files that are uploaded to Cloud Storage to FLAC file format with mono-channel audio @ 16000hz.
Uses a Storage trigger.

### [Presence for Firestore](/presence-firestore)

Build a simple online / offline status indicator for your users by leveraging Firestore and Realtime Database together.
Uses a Realtime Database trigger.

### [Publish Models to Firebase ML](/publish-model)

Automatically publishes models to Firebase ML for each TensorFlow Lite file that is uploaded to Firebase Storage.

### [Get information about a YouTube channel](/youtube)

This sample shows how to query the Youtube Data API.
Uses an HTTPS trigger.

## Contributing

We'd love that you contribute to the project. Before doing so please read our [Contributor guide](CONTRIBUTING.md).


## License

© Google, 2015-2020. Licensed under an [Apache-2](LICENSE) license.

## Build Status

[![Actions Status][gh-actions-badge]][gh-actions]

[gh-actions]: https://github.com/firebase/functions-samples/actions
[gh-actions-badge]: https://github.com/firebase/functions-samples/workflows/CI%20Tests/badge.svg
