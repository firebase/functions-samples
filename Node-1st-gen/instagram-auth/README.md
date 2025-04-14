# Use Instagram Sign In with Firebase

This sample shows how to authenticate using Instagram Sign-In on Firebase. In this sample we use OAuth 2.0 based authentication to get Instagram user information then create a Firebase Custom Token (using the Instagram user ID).

## Setup the sample

Create and setup the Firebase project:

1.  Create a Firebase project using the [Firebase Developer Console](https://console.firebase.google.com).
1.  Enable Billing on your Firebase the project by switching to the **Blaze** plan, this is currently needed to be able to perform HTTP requests to external services from a Cloud Function.

Create and provide a Service Account's credentials:

1.  Create a Service Accounts file as described in the [Server SDK setup instructions](https://firebase.google.com/docs/server/setup#add_firebase_to_your_app).
1.  Save the Service Account credential file as `./functions/service-account.json`

Create and setup your Instagram app:

1.  Register an Instagram app on [Instagram for Developers](https://www.instagram.com/developer/). You'll need to **Register a New Client**.
1.  Once Your app is created make sure you specify your app's callback URL in the list of **Valid redirect URIs** of your Instagram app. You should whitelist `https://localhost:5000/popup.html` for local development and if you deploy on App Engine (See Deploy section below) you should whitelist the URL `https://<application-id>.firebaseapp.com/popup.html`.
1.  Copy the **Client ID** and **Client Secret** of your Instagram app and use them to set the `instagram.client_id` and `instagram.client_secret` Google Cloud environment variables. For this use:

    ```bash
    firebase functions:config:set instagram.client_id="yourClientID" instagram.client_secret="yourClientSecret"
    ```

> Make sure the Instagram Client Secret is always kept secret. For instance do not save it in your version control system.

Deploy your project:

1.  Run `firebase use --add` and choose your Firebase project. This will configure the Firebase CLI to use the correct project locally.
1.  Run `firebase deploy` to effectively deploy the sample. The first time the Functions are deployed the process can take several minutes.

## Run the sample

Open the sample's website by using `firebase open hosting:site` or directly accessing `https://<project-id>.firebaseapp.com/`.

Click on the **Sign in with Instagram** button and a popup window will appear that will show the Instagram In authentication consent screen. Sign In and/or authorize the authentication request.

The website should display your name and profile pic from Instagram. At this point you are authenticated in Firebase and can use the database/hosting etc...

## Workflow and design

When clicking the **Sign in with Instagram** button a popup is shown which redirects users to the `redirect` Function URL.

The `redirect` Function then redirects the user to the Instagram OAuth 2.0 consent screen where (the first time only) the user will have to grant approval. Also the `state` cookie is set on the client with the value of the `state` URL query parameter to check against later on.

After the user has granted approval he is redirected back to the `./popup.html` page along with an OAuth 2.0 Auth Code as a URL parameter. This Auth code is then sent to the `token` Function using a JSONP Request. The `token` function then:

- Checks that the value of the `state` URL query parameter is the same as the one in the `state` cookie.
- Exchanges the auth code for an access token using the Instagram app credentials and gets the user identity (photoURL and full name).
- Mints a Custom Auth token (which is why we need Service Accounts Credentials).
- Returns the Custom Auth Token, photo URL, user display name and Instagram access token to the `./popup.html` page.

The `./popup.html` receives the Custom Auth Token and other data back from the AJAX request to the `token` Function and uses it to update the user's profile, saves the access token to the database, authenticate the user in Firebase and then close the popup.
At this point the main page will detect the sign-in through the Firebase Auth State observer and display the signed-In user information.
