Genkit quickstart
================================================

This quickstart demonstrates how to initialize a [Genkit flow](https://firebase.google.com/docs/genkit/flows) and serve it with Cloud Functions for Firebase.

[Read more about Cloud Functions for Firebase](https://firebase.google.com/docs/functions/)


Getting Started
---------------

1. Install dependencies with `npm install`
1. Start the functions emulator with `firebase emulators:start --only functions`
    1. The emulator will output the function URL. It is usually of the form:

    ```
    https://127.0.0.1:5001/{$PROJECT}/us-central1/tellJoke
    ```

1. Call the function from a terminal, replacing the `url` argument with your function's URL:

    ```bash
    $ curl -X POST \
        --url https://127.0.0.1:5001/{$PROJECT}/us-central1/tellJoke \
        --header "Content-Type: application/json" \
        --header "Accept: text/event-stream" \
        --data '{"data": "Observational comedy"}'
    ```

License
-------

© Google, 2025. Licensed under an [Apache-2](../../../LICENSE) license.