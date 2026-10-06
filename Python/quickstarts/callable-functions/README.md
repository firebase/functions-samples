# Firebase HTTPS Callable functions Quickstart (Python)

This quickstart shows how to write callable functions with the Firebase SDK for Cloud Functions in Python. Callable functions are HTTPS functions that your app calls with a Firebase client SDK, which handles the request format and passes along the user's authentication state.

[Read more about callable functions](https://firebase.google.com/docs/functions/callable?gen=2nd)

## Functions code

See [functions/main.py](functions/main.py) for the code. It defines two functions:

- `addnumbers`: Adds two numbers, `firstNumber` and `secondNumber`, passed in the request data and returns the result. It raises an `HttpsError` with the `INVALID_ARGUMENT` code if either number is missing.
- `addmessage`: Saves a message to the Realtime Database after removing swear words. The function requires the caller to be signed in and records the caller's user ID, name, picture, and email with the message.

## Deploy

1. Create a Firebase project in the [Firebase console](https://console.firebase.google.com) and enable the **Realtime Database**.
2. Install the [Firebase CLI](https://firebase.google.com/docs/cli) and sign in with `firebase login`.
3. Clone this repo and open the `Python/quickstarts/callable-functions` directory.
4. Select your project with `firebase use --add`.
5. Create a virtual environment and install the dependencies:

   ```bash
   cd functions
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   cd ..
   ```

6. Deploy with `firebase deploy --only functions`.

## Test

Callable functions use a [specific request format](https://firebase.google.com/docs/functions/callable-reference): a `POST` request with a JSON body whose payload sits under a `data` key. The **Testing** tab in the Google Cloud console sends a plain HTTP request, so it can't call these functions. Use one of the following instead.

### Call the function from a client

Call the function from your app with a Firebase client SDK, for example with the [Web SDK](https://firebase.google.com/docs/functions/callable?gen=2nd#web):

```js
import { getFunctions, httpsCallable } from "firebase/functions";

const addNumbers = httpsCallable(getFunctions(), "addnumbers");
const result = await addNumbers({ firstNumber: 1, secondNumber: 2 });
console.log(result.data.operationResult); // 3
```

The `addmessage` function requires a signed-in user, so sign in with [Firebase Authentication](https://firebase.google.com/docs/auth) before you call it. The SDK attaches the user's ID token to the request.

### Call the function with curl

For a quick check of `addnumbers`, which doesn't require authentication, send the callable request format yourself. Run the function in the [Local Emulator Suite](https://firebase.google.com/docs/emulator-suite):

```bash
firebase emulators:start --only functions
```

Then call it:

```bash
curl -X POST http://127.0.0.1:5001/YOUR_PROJECT_ID/us-central1/addnumbers \
  -H "Content-Type: application/json" \
  -d '{"data": {"firstNumber": 1, "secondNumber": 2}}'
```

The response wraps the function's return value in a `result` key:

```json
{"result": {"firstNumber": 1, "secondNumber": 2, "operator": "+", "operationResult": 3}}
```

The same request works against the deployed function at its `https://` URL, which `firebase deploy` prints.

## License

© Google, 2023. Licensed under an [Apache-2](../../../LICENSE) license.
