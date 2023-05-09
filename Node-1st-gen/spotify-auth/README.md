# Use Spotify Sign In with Firebase

This sample shows how to authenticate using Spotify Sign-In on Firebase. In this sample we use OAuth 2.0 based authentication to get Spotify user information then create a Firebase Custom Token (using the Spotify user ID).


## Setup the sample

Create and setup the Firebase project:
 1. Create a Firebase project using the [Firebase Developer Console](https://console.firebase.google.com).
 1. Enable Billing on your Firebase project by switching to the **Blaze** plan, this is currently needed to be able to perform HTTP requests to external services from a Cloud Function. See the [pricing](https://firebase.google.com/pricing/) page for more details.

Create and provide a Service Account's credentials:
 1. Create a Service Accounts file as described in the [Server SDK setup instructions](https://firebase.google.com/docs/server/setup#add_firebase_to_your_app).
 1. Save the Service Account credential file as `./functions/service-account.json`

Create and setup your Spotify app:
 1. Create a Spotify app in the [Spotify Developers website](https://developer.spotify.com/my-applications/).
 1. Add the URL `https://<application-id>.firebaseapp.com/popup.html` to the
    **Redirect URIs** of your Spotify app.
 1. Copy the **Client ID** and **Client Secret** of your Spotify app and use them to set the `spotify.client_id` and `spotify.client_secret` Google Cloud environment variables. For this use:

    ```bash
    firebase functions:config:set spotify.client_id="yourClientID" spotify.client_secret="yourClientSecret"
    ```

 > Make sure the Spotify Client Secret is always kept secret. For instance do not save this in your version control system.

Deploy your project:
 1. Run `firebase use --add` and choose your Firebase project. This will configure the Firebase CLI to use the correct project locally.
 1. Run `firebase deploy` to effectively deploy the sample. The first time the Functions are deployed the process can take several minutes.


## Run the sample

Open the sample's website by using `firebase open hosting:site` or directly accessing `https://<project-id>.firebaseapp.com/`.

Click on the **Sign in with Spotify** button and a popup window will appear that will show the Spotify authentication consent screen. Sign In and/or authorize the authentication request.

The website should display your display name, email and profile pic from Spotify. At this point you are authenticated in Firebase and can use the database/hosting etc...

## Workflow and design

When clicking the **Sign in with Spotify** button a popup is shown which redirects users to the `redirect` Function URL.

The `redirect` Function then redirects the user to the Spotify OAuth 2.0 consent screen where (the first time only) the user will have to grant approval. Also the `state` cookie is set on the client with the value of the `state` URL query parameter to check against later on.

After the user has granted approval he is redirected back to the `./popup.html` page along with an OAuth 2.0 Auth Code as a URL parameter. This Auth code is then sent to the `token` Function using a JSONP Request. The `token` function then:
 - Checks that the value of the `state` URL query parameter is the same as the one in the `state` cookie.
 - Exchanges the auth code for an access token using the Spotify app credentials.
 - Fetches the user identity using the Spotify API.
 - Mints a Custom Auth token (which is why we need Service Accounts Credentials).
 - Returns the Custom Auth Token, email, photo URL, user display name and Spotify access token to the `./popup.html` page.

  The `./popup.html` receives the Custom Auth Token and other data back from the AJAX request to the `token` Function and uses it to update the user's profile, saves the access token to the database, authenticate the user in Firebase and then close the popup.
 At this point the main page will detect the sign-in through the Firebase Auth State observer and display the signed-In user information.
