# HTTP Flask Example

This sample demonstrates how to expose a Flask app as a single Cloud Function. The Flask app provides a simple CRUD interface for "widgets" stored in the Realtime Database.

## Functions Code

See file [functions/main.py](functions/main.py) for the code.

The sample creates a Flask app and defines two routes:

- `GET /widgets` and `GET /widgets/<id>`: These routes retrieve a list of all widgets or a single widget by its ID from the Realtime Database.
- `POST /widgets`: This route adds a new widget to the Realtime Database.

The entire Flask app is then exposed as a single Cloud Function called `httpsflaskexample` using `@https_fn.on_request()`.

## Trigger rules

The `httpsflaskexample` function is triggered by an HTTP request.

## Deploy and test

To deploy and test the sample:

1. Create a Firebase project on the [Firebase Console](https://console.firebase.google.com).
2. Get the code, for instance using `git clone https://github.com/firebase/functions-samples`
3. Enter the correct directory `cd functions-samples/Python/http-flask`
4. Set up the CLI to use your Firebase project using `firebase use --add` and select your Firebase project.
5. Deploy your project's code using `firebase deploy`.
6. Use a tool like `curl` to test the function:
   - **Add a widget:** `curl -X POST -d "My new widget" https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/httpsflaskexample/widgets`
   - **Get all widgets:** `curl https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/httpsflaskexample/widgets`
   - **Get a specific widget:** `curl https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/httpsflaskexample/widgets/WIDGET_ID`
