# Authenticated JSON API

This sample shows how to authenticate access to a JSON API to only allow
access to data for a specific Firebase user.

Only users who pass a valid Firebase ID token as a Bearer token in the
`Authorization` header of the HTTP request are authorized to use the API.

This sample comes with a web-based API explorer UI whose code is in the [public](public) directory.
It lets you sign in to Firebase with your Google account, and create messages whose sentiments are
detected by the [Cloud Natural Language API](https://cloud.google.com/natural-language/).

## Setting up the sample

1.  Create a Firebase Project using the [Firebase Console](https://console.firebase.google.com).
1.  Enable the **Google** Provider in the **Auth** section.
1.  Enable Billing on your project (to connect to the Natural Language API) by switching to the Blaze plan.
1.  Clone or download this repo and open the `authenticated-json-api` directory.
1.  You must have the Firebase CLI installed. If you don't have it install it with `npm install -g firebase-tools` and then configure it with `firebase login`.
1.  Configure the CLI locally by using `firebase use --add` and select your project in the list.
1.  Install dependencies locally by running: `cd functions; npm install; cd -`
1.  [Enable the Google Cloud Natural Language API](https://console.cloud.google.com/apis/api/language.googleapis.com/overview?project=_)

## Deploy and test

This sample comes with a web-based UI for testing the function.
To test locally do:

1. [Set up admin credentials](https://firebase.google.com/docs/functions/local-emulator#set_up_admin_credentials_optional) so that the emulator can talk to the Natural Language API
1. Start serving your project locally using `firebase serve --only hosting,functions`
1. Open the app in a browser at `https://localhost:5000`.
1. Sign in to the web app in the browser using Google Sign-In
1. Create messages and explore them using the List and Detail sections.
1. Sign out. You should no longer be able to access the API.

To deploy and test on prod do:

1.  Deploy your project using `firebase deploy`
1.  Open the app using `firebase open hosting:site`, this will open a browser.
1.  Sign in to the web app in the browser using Google Sign-In
1.  Create messages and explore them using the List and Detail sections.
1.  Sign out. You should no longer be able to access the API.

## Contributing

We'd love that you contribute to the project. Before doing so please read our [Contributor guide](../CONTRIBUTING.md).

## License

© Google, 2017. Licensed under an [Apache-2](../LICENSE) license.
