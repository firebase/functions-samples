# Isomorphic React App

This sample shows how to create an isomorphic React application using using Functions, Hosting, and Realtime Database.

During the initial request to your app, Hosting will proxy your request to a Node express server.
The server will then load any data that's necessary for your app (through the Realtime Database). It will also generate the markup that's needed from React. It will inject the markup with the preloaded state before passing it to the client.

This sample uses `react-router` to demonstrate simple routing logic for React.

The `src` folder contains the source code for React app. It also uses [Webpack](https://github.com/webpack/webpack) to bundle the app and generate two bundles, one for the server, and one for the client. The server bundle is required by the express server to generate the initial markup (also known as Server-Side Rendering). The client bundle is loaded by the browser.

## Setting up the sample

 1. Create a Firebase Project using the [Firebase Console](https://console.firebase.google.com).
 1. Clone or download this repo and open the `isomorphic-react-app` directory.
 1. You must have the Firebase CLI installed. If you don't have it install it with `npm install -g firebase-tools` and then configure it with `firebase login`.
 1. Configure the CLI locally by using `firebase use --add` and select your project in the list.
 1. Install the Cloud Functions dependencies locally by running: `cd functions; npm install`
 1. Install the React app's dependencies locally by running: `cd ../src; npm install`
 1. Run `npm run build` within the `src` folder to start webpack, which will bundle the app. It will output `functions/build/server.bundle.js` and `public/assets/client.bundle.js`
 1. Import the sample data `functions/data-seed.json` to your Firebase Realtime Database. For more details, see [https://support.google.com/firebase/answer/6386780?hl=en#import](https://support.google.com/firebase/answer/6386780?hl=en#import)
 1. Deploy the Realtime Database security rules by running: `firebase deploy --only database`


## Deploy and test

This sample comes with a web-based UI for testing the function.
To test locally do:

 1. Start serving your project locally using `firebase serve --only hosting,functions`
 1. Open the app in a browser at `https://localhost:5000`.

To test it out:

 1. Deploy your project using `firebase deploy`
 1. Open the app using `firebase open hosting:site`, this will open a browser.


## Contributing

We'd love that you contribute to the project. Before doing so please read our [Contributor guide](../CONTRIBUTING.md).


## License

© Google, 2017. Licensed under an [Apache-2](../LICENSE) license.
