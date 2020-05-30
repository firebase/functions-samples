# Create Stripe customers and charge them on Cloud Firestore write

This sample shows how to create Stripe customers and charge them when Cloud Firestore is written to.

Further reading:

- Stripe Node API: https://stripe.com/docs/api/node
- Firebase SDK: https://firebase.google.com/docs/functions

## Functions Code

See file [functions/index.js](functions/index.js) for the code.

The dependencies are listed in [functions/package.json](functions/package.json).

## Deploy and test

To test this integration:

- Create a Firebase Project using the [Firebase Developer Console](https://console.firebase.google.com)
- Enable billing on your project by switching to the Blaze or Flame plan. See [pricing](https://firebase.google.com/pricing/) for more details. This is required to be able to do requests to non-Google services.
- [Enable Google sign on your Firebase project ](https://console.firebase.google.com/project/_/authentication/providers)
- Install [Firebase CLI Tools](https://github.com/firebase/firebase-tools) if you have not already and log in with `firebase login`.
- Configure this sample to use your project using `firebase use --add` and select your project.
- Install dependencies locally by running: `cd functions; npm install; cd -`
- [Add your Stripe API Secret Key](https://dashboard.stripe.com/account/apikeys) to firebase config:
  ```bash
  firebase functions:config:set stripe.secret=<YOUR STRIPE API KEY>
  ```
- _Optional:_ change your default currency `firebase functions:config:set stripe.currency=GBP`
- Pass your [Stripe publishable key](https://dashboard.stripe.com/account/apikeys) to the `Stripe.setPublishableKey` call in `public/index.html`
- Deploy your project using `firebase deploy`
- Test your Stripe integration by viewing your deployed site `firebase open hosting:site`

## Run client locally

```
firebase deploy --only functions
firebase serve --only hosting
```
