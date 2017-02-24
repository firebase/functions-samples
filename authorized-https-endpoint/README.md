# Authorized HTTPS Endpoint

This samples shows how to restrict an HTTPS Function to only the Firebase users of your app.

Only users who pass a valid Firebase ID token as a Bearer token in the Authorization header of the HTTP request are authorized to use the function.

Checking the ID token is done with an ExpressJs middleware that also passes the decoded ID token in the Express request object.

Once authrorized the function respond with 'Hello <username>'.

This sample comes with a simple web-based UI which code is in [public](public) directory that lets you sign-in Firebase and initiates an authorized XHR to the Function.


## Setting up the sample

 1. Create a Firebase Project using the [Firebase Console](https://console.firebase.google.com).
 1. Enable the **Google** Provider in the **Auth** section.
 1. Clone or download this repo and open the `authenticated-https-endpoint` directory.
 1. Paste the Web initialization snippet from: **Firebase Console > Overview > Add Firebase to your web app** in the `public/index.html` where the `TODO` is located.
 1. Download a Service Account credentials from: **Firebase Console > ⚙ > Project Settings > SERVICE ACCOUNTS > GENERATE NEW PRIVATE KEY** and save the file as `functions/service-account.json`.
 1. Configure the CLI locally by using `firebase use --add` and select your project in the list.
 1. You must have the Firebase CLI installed. If you don't have it install it with `npm install -g firebase-tools` and then configure it with `firebase login`.
 1. Configure the CLI locally by using `firebase use --add` and select your project in the list.
 1. Install dependencies locally by running: `cd functions; npm install; cd -`


## Deploy and test

This sample comes with a web-based UI for testing the function. To test it out:

 1. Deploy your project using `firebase deploy`
 1. Open the app using `firebase open hosting:site`, this will open a browser.
 1. Sign in the web app in the browser using Google Sign-In and delete your account using the button on the web app. You should receive email confirmations for each actions.


## Contributing

We'd love that you contribute to the project. Before doing so please read our [Contributor guide](../CONTRIBUTING.md).


## License

© Google, 2017. Licensed under an [Apache-2](../LICENSE) license.
