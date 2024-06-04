Call the Vertex AI Gemini API with Remote Config and App Check
==============================================================

Introduction
------------

This is a sample callable function that authenticates clients with App
Check and then sends queries to Gemini using the Vertex AI Gemini API. Vertex
AI model parameters (including the model itself) are controlled by
Remote Config server features included in the Firebase Admin SDK for
Node.js.

Use the web client provided in `client/` to test the function.

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

Get Started
---------------

 1. Follow the instructions in client/README.md to create a Firebase project,
    enable ReCAPTCHA Enterprise, enable and enforce Firebase App Check, and add
    your Firebase config and ReCAPTCHA Enterprise key to the client config.
 
 2. Enable [recommended Vertex AI APIs](https://console.cloud.google.com/vertex-ai).
 
 3. Configure a Remote Config server template on the Firebase console. Use the template
    described in
    [Use server side Remote Config with Cloud Functions and Vertex
    AI](https://firebase.google.com/docs/remote-config/solution-server#implementation-create-template),
    which contains all of the parameters used in this function sample.
 
 4. Install dependencies: `cd functions && npm install`
 
 5. If you haven't already done so, install firebase-tools:
  
    `npm i firebase-tools@latest`
 
 6. Log into Firebase:
 
    `firebase login`
 
 7. Deploy the function. We recommend testing in the
    [Firebase emulator](https://firebase.google.com/docs/remote-config/solution-server#implementation-deploy-and-test-in-emulator):
 
    `firebase emulators:start`
 
 8. If testing in the emulator, verify that `testMode` is set to `true` in
     `client/main.ts`, then start the client:

    `cd client && npm run dev`

    TIP: If you're using the emulator, you can deploy both the function and hosting
         to the emulator. From the `client` directory, run `npm run build`.
         Then, from the parent directory, run `firebase server --only functions,hosting`.
         Open http://localhost:5000 to access and test the web client's connection
         to the `callVertexWithRC` function.
    
 0. Open the [client app in a browser](http://localhost:5173) and enter a
    prompt. To access the Vertex AI Gemini API, make sure that you have
    set the `is_vertex_enabled` boolean parameter in your Remote Config
    server template to `true`.

Support
-------

- [Firebase Support](https://firebase.google.com/support/)

License
-------

© Google, 2024. Licensed under an [Apache-2](../../LICENSE) license.
