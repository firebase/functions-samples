# Use server-side Remote Config with Cloud Functions and Vertex AI

This Cloud Function (`generateWithVertex`) demonstrates how to generate text
using Google's Vertex AI Gemini API, protected by Firebase App Check. It uses
the Firebase Admin SDK for Node.js and Remote Config to manage model parameters,
safety settings, and feature flags.

## Setting up the sample

Follow the [User server-side Remote Config with Cloud Functions and Vertex AI
guide](https://firebase.google.com/docs/remote-config/solution-server) to:

* Set up your Firebase project.
* Enable required APIs and SDKs.
* Configure IAM permissions.
* Test your function in the Firebase emulator.
* Deploy your function.

Important:  App Check, Vertex AI and Cloud Functions require a billing
account. Review
[Vertex AI pricing](https://cloud.google.com/vertex-ai/pricing) and
[Firebase pricing](https://firebase.google.com/pricing) before running
this function. If you're new to Firebase and Google Cloud, check to see if
you're eligible for a
[$300 credit](https://firebase.google.com/support/faq#pricing-free-trial) and
a Free Trial Cloud Billing account.

## Next steps

Learn more about Remote Config server implementations at
[Use Remote Config in server
environments](https://firebase.google.com/docs/remote-config/server).
