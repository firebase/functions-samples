# Post Sign-up Event with Google Calendar

This sample demonstrates how to use an [Auth blocking function](https://firebase.google.com/docs/functions/auth-blocking-events) to save a user's Google OAuth2 access token to Firestore upon sign-up. It then uses a [task queue](https://firebase.google.com/docs/functions/task-functions) to schedule a Cloud Function that uses this token to create a Google Calendar event for the user.

## Functions Code

See file [functions/main.py](functions/main.py) for the code.

The function `savegoogletoken` is an Auth blocking function that triggers before a user is created. If the user is signing up with Google, it saves their OAuth2 access token to a `user_info` collection in Firestore. It then creates a task to call the `scheduleonboarding` function.

The `scheduleonboarding` function is a task queue function that retrieves the user's access token from Firestore, creates a new event on their primary Google Calendar, and then deletes the access token from Firestore.

## Trigger rules

- The `savegoogletoken` function is triggered by `beforeUserCreated` Auth blocking event.
- The `scheduleonboarding` function is triggered by a task queue.

## Deploy and test

To deploy and test the sample:

1. Create a Firebase project on the [Firebase Console](https://console.firebase.google.com).
2. Enable the **Google Calendar API** for your project in the [Google Cloud Console](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com).
3. Enable blocking functions for your project in the Firebase console:
   - Go to the **Authentication** > **Settings** page.
   - In the **Blocking functions** section, select **Before user creation (beforeCreate)** from the dropdown menu.
   - Ensure that **Enable credential pass-through** is checked.
4. Get the code, for instance using `git clone https://github.com/firebase/functions-samples`
5. Enter the correct directory `cd functions-samples/Python/post-signup-event`
6. Set up the CLI to use your Firebase project using `firebase use --add` and select your Firebase project.
7. Deploy your project's code using `firebase deploy`.
8. Sign up for your app using a Google account.
9. After a minute, check your Google Calendar for a new "Onboarding with ExampleCo" event.
