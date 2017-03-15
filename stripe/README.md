# Create Stripe customers and charge them on RTDB write

This sample shows how to create Stripe customers and charge them when the Realtime Database is written to.

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
 - Configure this sample to use your project using `firebase --use add` and select your project.
 - Install dependencies locally by running: `cd functions; npm install; cd -`
 - [Add your Stripe API Secret Key](https://dashboard.stripe.com/account/apikeys) to firebase config:
     ```bash
     firebase functions:config:set stripe.token=<YOUR STRIPE API KEY>
     ```
 - *Optional:* change your default currency `firebase functions:config:set stripe.currency=GBP`
 - Deploy your project using `firebase deploy`
 - Test the Stripe integration by:
   - [Add a new user account in the Firebase Console](https://console.firebase.google.com/project/_/authentication/users), this should create a new Stripe customer record
   - [Set a payment method for the customer in the Stripe Console](https://dashboard.stripe.com/customers) (you'd normally do this in your front-end with a Stripe SDK)
   - [Write some amount to the RTDB under `/users/{userId}/charges/{pushId}`](https://console.firebase.google.com/project/_/database/data)
