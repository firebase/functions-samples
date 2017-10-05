# Accept PayPal payment in functions firebase

This sample demonstrates how to use the Paypal-rest-sdk with a Google CLoud Functions.


## Functions Code

See file [functions/index.js](functions/index.js) for the code.

The dependencies are listed in [functions/package.json](functions/package.json).


## Process PayPal payments

1. [Set up a payment information object](https://developer.paypal.com/docs/api/quickstart/payments/#set-up-the-payment-information-object) that contains details about the PayPal payment.

2. [Initialize the payment and redirect the user](https://developer.paypal.com/docs/api/quickstart/payments/#initialize-the-payment-and-redirect-the-user). To do so, send the payment object to PayPal. This action provides a redirect URL to which to redirect the user. After the user confirms the payment, PayPal redirects the user to the return URLs specified in the payment object.

3. [Complete the payment](https://developer.paypal.com/docs/api/quickstart/payments/#complete-the-payment). Use the payer and payment IDs provided in the query string following the redirect.


## Setting up the sample

 1. Create a Firebase project on the [Firebase application console](https://console.firebase.google.com).
 1. Enable billing on your Firebase project by switching to the Blaze or Flame plan. See [pricing](https://firebase.google.com/pricing/) for more details. This is required to be able to do requests to non-Google services.
 1. Clone or download this repo and open the `paypal` directory.
 1. You must have the Firebase CLI installed. If you don't have it install it with `npm install -g firebase-tools` and then configure it with `firebase login`.
 1. Configure the CLI locally by using `firebase use --add` and select your project in the list.
 1. [Create a Paypal REST API app](https://developer.paypal.com/developer/applications/create) and note your **Client ID** and **Client Secret**.
 1. Setup [your Paypal API Client ID and Secret](https://developer.paypal.com/developer/applications/) in your Cloud Function. Run in the command line:
  
    ```sh
    firebase functions:config:set paypal.client_id="yourPaypalClientID"
    ```

    ```sh
    firebase functions:config:set paypal.client_secret="yourPaypalClientSecret"
    ```
 1. Install dependencies locally by running: `cd functions; npm install; cd -`


## Deploy and test

This sample comes with a web-based UI.
To test locally do:

 1. Start serving your project locally using `firebase serve --only hosting,functions`
 1. Send a `POST` request with body `{price:5}` to `https://localhost:5000/pay`. You will get a 302 Redirect redirecting to the payment page.


To deploy and test on prod do:

 1. Deploy your project using `firebase deploy`
 1. Send a `POST` request with body `{price:5}` to `https://us-central1-<project-id>.cloudfunctions.net/pay`. You will get a 302 Redirect redirecting to the payment page.

## Contributing

We'd love that you contribute to the project. Before doing so please read our [Contributor guide](../CONTRIBUTING.md).


## License

© Google, 2017. Licensed under an [Apache-2](../LICENSE) license.

