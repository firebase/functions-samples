# Server-side generated pages w/ Handlebars templating and user sessions

This samples shows how to serve server-side generated HTML pages using the [HandlebarsJs](http://handlebarsjs.com/) templating system.

It also shows how to serve user specific content by passing the Firebase ID token of the signed-in user in a `__session` cookie.

Checking and decoding the ID token passed in the `__session` cookie is done with an ExpressJs middleware.

Some custom scripts in [functions/views/layouts/main.handlebars] maintain the Firebase ID token in the `__session` cookie.

## Setting up the sample

1.  Create a Firebase Project using the [Firebase Console](https://console.firebase.google.com).
1.  Enable the **Google** Provider in the **Auth** section.
1.  Clone or download this repo and open the `template-handlebars` directory.
1.  You must have the Firebase CLI installed. If you don't have it install it with `npm install -g firebase-tools` and then configure it with `firebase login`.
1.  Configure the CLI locally by using `firebase use --add` and select your project in the list.
1.  Install dependencies locally by running: `cd functions; npm install; cd -`

## Deploy and test

This sample comes with a web-based UI for testing the function.
To test locally do:

1.  Start serving your project locally using `firebase serve --only hosting,functions`
1.  Open the app in a browser at `https://localhost:5000`.
1.  Sign in the web app in the browser using Google Sign-In and some user information will be displayed on a server-side generated page.

To deploy and test the app on prod do:

1.  Deploy your project using `firebase deploy`
1.  Open the app using `firebase open hosting:site`, this will open a browser.
1.  Sign in the web app in the browser using Google Sign-In and some user information will be displayed on a server-side generated page.

## Contributing

We'd love that you contribute to the project. Before doing so please read our [Contributor guide](../CONTRIBUTING.md).

## License

© Google, 2017. Licensed under an [Apache-2](../LICENSE) license.
