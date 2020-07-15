# Authenticate with Firebase using Okta

Sample app that demonstrates how to authenticate with Firebase using Okta.

## Overview

This sample has two parts:

- A Node.js backend that “exchanges” Okta access tokens for Firebase custom
  authentication tokens. The backend is intended to be deployed as a Cloud
  Function, but because its just an Express.js app, you can also run on it on
  your own infrastructure.
- A web frontend that signs users in with Okta, gets a Firebase custom
  authentication token from your backend, and authenticates with Firebase using
  the custom token.

## Setup

Before you try the demo with the Firebase emulator suite or deploy it to
Firebase Hosting and Cloud Functions, set up your Okta and Firebase projects,
and install the Firebase CLI tool:

1.  On the [Okta Developer site](https://developer.okta.com/):

    1.  Sign in or sign up.
    2.  Take note of your **Org URL** (top-right of the dashboard) for later.
    3.  Create a user with a password in your Okta project. (This demo doesn't
        have a sign-up flow.)
    4.  On the Applications page, add a Single-Page App:
        1.  Set the **Base URIs** to `http://localhost:5000`.
        2.  Set the **Login redirect URIs**  to `http://localhost:5000`.
        3.  Enable the **Authorization Code** grant type.
        4.  Click **Done**. Take note of the app's **Client ID** for later.
    5.  In **API > Trusted Origins**, confirm that `http://localhost:5000` is
        listed, with **CORS** and **Redirect** enabled.

2.  In the [Firebase console](https://console.firebase.google.com/):

    1. Create a new Firebase project. Take note of your **project ID** for
       later.
    2. On the Project Overview page, add a new web app. Be sure **Also set up
       Firebase Hosting for this app** is selected.
    3. If you plan to try the demo in the emulator, [generate and download a
       service account key][svcacct].

3.  If you don't already have a Node.js 10 (or newer) environment,
    [install Node.js](https://nodejs.org/).

4.  If you haven't already installed the Firebase CLI tool, do it now:

    ```
    $ npm install --global firebase-tools
    ```

[svcacct]: https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk

## Try the demo with the Firebase emulator suite

1.  Make sure the Firebase CLI tool is set to use your Firebase project:

    ```
    $ cd functions-samples/okta-auth
    okta-auth$ firebase login
    okta-auth$ firebase use <YOUR_FIREBASE_PROJECT_ID>
    ```

2.  Run `setup.js` from the Firebase project directory:

    ```
    okta-auth$ node setup.js
    ```

    The script will prompt you for some of your Okta and Firebase configuration
    values and create configurations files from them. The script won't
    overwrite existing files.

3.  Start the emulators:

    ```
    okta-auth$ firebase emulators:start
    ```

4.  Open the web app: [`http://localhost:5000`](http://localhost:5000).

## Deploy the demo to Firebase Hosting and Cloud Functions

1.  [Upgrade your Firebase project to the Blaze (pay as you go) plan](https://console.firebase.google.com/project/_/overview?purchaseBillingPlan=metered).
    The Blaze plan is required to access external services (Okta) from Cloud
    Functions.

2.  In the Google Cloud console:

    1.  [Enable the IAM Service Account Credentials API](https://console.cloud.google.com/apis/api/iamcredentials.googleapis.com/overview?project=_).
    2.  On the [IAM](https://console.developers.google.com/iam-admin/iam?project=_)
        page, edit the account named **App Engine default service account** and
        add the **Service Account Token Creator** role.

3.  Make sure the Firebase CLI tool is set to use your Firebase project:

    ```
    $ cd functions-samples/okta-auth
    okta-auth$ firebase login
    okta-auth$ firebase use <YOUR_FIREBASE_PROJECT_ID>
    ```

4.  Run `setup.js -d` from the Firebase project directory:

    ```
    okta-auth$ node setup.js -d
    ```

    The script will prompt you for some of your Okta and Firebase configuration
    values, create configurations files from them, and set some Cloud Funcions
    environment settings. The script won't overwrite existing files or Cloud
    Functions environment settings.

5.  Deploy the project:

    ```
    okta-auth$ firebase deploy
    ```

6.  Open the web app at: `https://<YOUR_FIREBASE_PROJECT_ID>.web.app`
