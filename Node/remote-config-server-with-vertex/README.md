# Use server-side Remote Config with Cloud Functions and Vertex AI

This Cloud Function (`generateWithVertex`) demonstrates how to generate text
using Google's Vertex AI Gemini API. It uses
the Firebase Admin SDK for Node.js and Remote Config to manage model parameters,
safety settings, and feature flags.

To protect your API endpoints, function is intended to run with a service
account with unauthenticated access blocked as described in
[Use server-side Remote Config with Cloud Functions and Vertex
AI](https://firebase.google.com/docs/remote-config/solution-server).

For a callable function with App Check enabled, try the
[Call the Vertex AI Gemini API with Remote Config and App Check](../call-vertex-remote-config-server)
sample function and client.

## Set up the sample

Follow the [User server-side Remote Config with Cloud Functions and Vertex AI
guide](https://firebase.google.com/docs/remote-config/solution-server) to:

* Set up your Firebase project.
* Enable required APIs and SDKs.
* Configure IAM permissions.
* Test your function in the Firebase emulator.
* Deploy your function.

Important:  Vertex AI and Cloud Functions require a billing account. Review
[Vertex AI pricing](https://cloud.google.com/vertex-ai/pricing) and
[Cloud Functions pricing](https://firebase.google.com/pricing) before running
this function. If you're new to Firebase and Google Cloud, check to see if
you're eligible for a
[$300 credit](https://firebase.google.com/support/faq#pricing-free-trial) and
a Free Trial Cloud Billing account.

## Next steps

Learn more about Remote Config server implementations at
[Use Remote Config in server
environments](https://firebase.google.com/docs/remote-config/server).

Support
-------

- [Firebase Support](https://firebase.google.com/support/)

License
-------

© Google, 2024. Licensed under an [Apache-2](../../LICENSE) license.

