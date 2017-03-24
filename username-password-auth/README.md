# Username/password sign in with Firebase

This sample shows how to authenticate with a username/password to Sign-In with Firebase. In this sample we use a basic authentication request with the supplied credentials and if succesful create a Firebase Custom Token.

NOTE: [Firebase Authentication](https://firebase.google.com/docs/auth/web/password-auth) can be used for email address/password sign in. This sample specifically addresses the case in which an email address is not used as the unique identifier for a user.

## Setup the sample

Create and setup the Firebase project:
 1. Create a Firebase project using the [Firebase Developer Console](https://console.firebase.google.com).
 1. Enable Billing on your Firebase project by switching to the **Blaze** plan, this is currently needed to be able to perform HTTP requests to external services from a Cloud Function.
 1. Copy the Web initialisation snippet from **Firebase Console > Overview > Add Firebase to your web app** and paste it in `public/index.html` in lieu of the placeholder (where the `TODO(DEVELOPER)` is located).

Create and provide a Service Account's credentials:
 1. Create a Service Accounts file as described in the [Server SDK setup instructions](https://firebase.google.com/docs/server/setup#add_firebase_to_your_app).
 1. Save the Service Account credential file as `./functions/service-account.json`

Deploy your project:
 1. Run `firebase use --add` and choose your Firebase project. This will configure the Firebase CLI to use the correct project locally.
 1. Run `firebase deploy` to effectively deploy the sample. The first time the Functions are deployed the process can take several minutes.


## Run the sample

Open the sample's website by using `firebase open hosting:site` or directly accessing `https://<project-id>.firebaseapp.com/`.

Enter credentials and click on the **Sign in** button. At this point you are authenticated in Firebase and can use the database/hosting etc...

## Workflow and design

When clicking the **Sign in** button the `auth` Cloud Function authenticates the username/password then Mints and returns a Firebase Custom Auth token (which is why we need Service Accounts Credentials).

The [httpbin](https://httpbin.org) request & response service is used for the basic authentication request in this example.

The main page will detect the sign-in through the Firebase Auth State observer and display the signed-In user information.

NOTE: In production you'll need to update the placeholder `authenticate` function in `./functions/index.js` so that it authenticates with your own credentials system.
