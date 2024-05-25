Test client for call-vertex-remote-config-server
================================================

Introduction
------------

This is a basic web app that calls the `callVertexWithRC` function. The
function uses values stored in Remote Config server templates with
the Firebase Admin SDK to change Vertex AI Gemini API parameters on the
fly. Access is controlled using Firebase App Check.

- [Read more about Remote Config for servers](https://firebase.google.com/docs/remote-config/server).
- [Read more about App Check](https://firebase.google.com/docs/app-check).
- [Read more about the Vertex AI Node.js Client library](https://cloud.google.com/nodejs/docs/reference/aiplatform/latest).

Important:  Vertex AI and Cloud Functions require a billing account. Review
[Vertex AI pricing](https://cloud.google.com/vertex-ai/pricing) and
[Firebase pricing](https://firebase.google.com/pricing) before running
this function. If you're new to Firebase and Google Cloud, check to see if
you're eligible for a
[$300 credit](https://firebase.google.com/support/faq#pricing-free-trial) and
a Free Trial Cloud Billing account.

Get started
---------------

 1. Create a [Firebase project and register a web app](https://firebase.google.com/docs/web/setup#create-firebase-project-and-app).
 2. [Create a ReCAPTCHA Enterprise key](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider#project-setup)
    in the same project.
 3. [Enable App Check](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider)
    in the Firebase console with the ReCAPTCHA Enterprise site key you created.
 4. Copy your Firebase project config and your ReCAPTCHA Enterprise site key
    into the appropriate places in `config.ts` in this directory.
 5. In this directory, run `npm install`.
 6. Set up the function as described in [../README.md](../README.md).
 7. In this directory, run `npm run dev` to run the client.

We recommend running and testing functions locally before deploying to Google
Cloud. To run this app against the `callVertexWithRC` function running in an
emulator, set `testMode` to true.

Support
-------

- [Firebase Support](https://firebase.google.com/support/)

License
-------

© Google, 2024. Licensed under an [Apache-2](../../../LICENSE) license.
