Example callable function that uses Remote Config server with Vertex AI and Firebase App Check
============================================================================================

Introduction
------------

This is a sample function that provides a basic web form to interact with Google Gemini models
using Vertex AI Gemini API. Parameters are controlled by Remote Config server templates, and
the function is secured with App Check.

<!-- Introduction
------------

[Read more about Remote Config for servers](https://firebase.google.com/docs/remote-config/server).

Getting Started
---------------

 1. Create your project on the [Firebase Console](https://console.firebase.google.com).
 2. Follow the instructions in client/README.md to set up the app client, ReCAPTCHA Enterprise,
    and Firebase App Check.
 3. Ensure that the service account running the function has the following IAM roles:
    - Remote Config Viewer
    - AI platform developer
    - Vertex AI user
    - Cloud Run Invoker
 4. Configure a Remote Config server template on the Firebase console
    (see [Use Remote Config in server environments](https://firebase.google.com/remote-config/server)
    and
    [Use server side Remote Config with Cloud Functions and Vertex AI](https://firebase.google.com/remote-config/solutions-server)
    for more information. 

To run this function and skip accessing the Vertex AI API (for testing), set is_vertex_enabled to false in 
the Remote Config server template. 

Important:  Vertex AI, Cloud Functions, and Firebase App Check require a
billing account. Review
[Vertex AI pricing](https://cloud.google.com/vertex-ai/pricing) and
[Firebase pricing](https://firebase.google.com/pricing) before running
this function. If you're new to Firebase and Google Cloud, check to see if
you're eligible for a
[$300 credit](https://firebase.google.com/support/faq#pricing-free-trial) and
a Free Trial Cloud Billing account.

 
<!-- Support
-------

- [Firebase Support](https://firebase.google.com/support/) -->

License
-------

© Google, 2024. Licensed under an [Apache-2](../LICENSE) license.
