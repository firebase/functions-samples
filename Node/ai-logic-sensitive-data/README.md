# Firebase AI Logic: Redact sensitive data with Cloud Sensitive Data Protection (2nd gen)

This sample demonstrates how to use **Firebase AI Logic triggers** (available in `firebase-functions` 7.4.0 and later) in conjunction with [**Cloud Sensitive Data Protection (DLP)**](https://cloud.google.com/security/products/sensitive-data-protection) to automatically inspect and redact sensitive data (PII) **before** sending prompts to the Gemini API and **after** receiving responses from the model.

## Introduction

[Firebase AI Logic triggers](https://firebase.google.com/docs/ai-logic/pre-and-post-request-scripts) allow you to run custom server-side scripts that intercept every `generateContent` request sent to the Gemini API through Firebase AI Logic — without modifying your client application code. For complete architectural limits and constraints, see the [Firebase AI Logic documentation](https://firebase.google.com/docs/ai-logic/pre-and-post-request-scripts).

This sample implements two 2nd Gen Cloud Functions:

1. **`redactPrompt` (`beforeGenerateContent`)**:
   Runs *before* a request reaches the Gemini API. It inspects text parts in the prompt's `contents` (as well as `systemInstruction`, if present) for sensitive information (such as email addresses and phone numbers) and replaces them with standard infoType placeholders (for example, `[EMAIL_ADDRESS]` or `[PHONE_NUMBER]`). If sensitive data was found, the function returns the modified request. If no sensitive data was detected, it returns without modifying the request.

2. **`redactResponse` (`afterGenerateContent`)**:
   Runs *after* the Gemini API returns a response and *before* that response is returned to the client app. It inspects the generated text in the response `candidates` for sensitive information and redacts any matching tokens.

### Request flow

```
[Client App]
     │
     │ 1. generateContent request
     ▼
[Firebase AI Logic Proxy]
     │
     │ 2. Triggers beforeGenerateContent
     ▼
[Cloud Function: redactPrompt] ──(Cloud SDP / DLP API)──> Redacts sensitive data in prompt
     │
     │ 3. Sanitized prompt forwarded to Gemini API
     ▼
[Gemini API (Google AI / Vertex AI)]
     │
     │ 4. Response generated
     ▼
[Firebase AI Logic Proxy]
     │
     │ 5. Triggers afterGenerateContent
     ▼
[Cloud Function: redactResponse] ──(Cloud SDP / DLP API)──> Redacts sensitive data in response
     │
     │ 6. Sanitized response returned to client
     ▼
[Client App]
```

## Prerequisites

1. A **Firebase project** upgraded to the [Blaze "pay-as-you-go" plan](https://firebase.google.com/pricing).
2. [Firebase CLI](https://firebase.google.com/docs/cli) installed and authenticated:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
3. Enable the **Cloud Sensitive Data Protection API** (formerly Cloud DLP):
   The sample declares this requirement using `requiresAPI('dlp.googleapis.com', ...)` in `functions/index.js`, so the Firebase CLI prompts you to enable it automatically during deployment.
   If you wish to enable it manually ahead of time:
   ```bash
   gcloud services enable dlp.googleapis.com --project=YOUR_PROJECT_ID
   ```
4. **IAM permissions**:
   - The functions in this sample use declarative IAM roles (`requiresRole('roles/dlp.user')` in `functions/index.js`). When deployed, the Firebase CLI automatically provisions a service account with the required Cloud Sensitive Data Protection role.
   - If manual IAM configuration is needed, grant `roles/dlp.user` to your Cloud Functions (2nd gen) runtime service account (the Compute Engine default service account):
     ```bash
     PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")
     gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
       --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
       --role="roles/dlp.user"
     ```

## Set up and deploy

1. Navigate to the sample directory:
   ```bash
   cd Node/ai-logic-sensitive-data
   ```

2. Select your Firebase project:
   ```bash
   firebase use --add
   ```

3. Install dependencies in the `functions` directory:
   ```bash
   cd functions
   npm install
   ```

4. Deploy the functions to Firebase:
   ```bash
   firebase deploy --only functions
   ```

   Once deployed, the `redactPrompt` and `redactResponse` functions are automatically registered with Firebase AI Logic in the `global` region as blocking triggers.

## Test locally

You can test the Cloud Functions locally using unit tests or the Firebase Local Emulator Suite:

- **Unit tests**: The sample includes an automated test suite using Node.js's native test runner (`node:test`). The tests mock the Cloud Sensitive Data Protection client to verify detection, fail-closed error handling with `HttpsError`, and request structures without making network calls:
  ```bash
  cd functions
  npm test
  ```

- **Local Emulator Suite**: Start the functions emulator:
  ```bash
  firebase emulators:start --only functions
  ```
  Because the Firebase AI Logic proxy service runs in Google Cloud infrastructure, the emulator serves the `redactPrompt` and `redactResponse` functions as local HTTP endpoints. You can test these endpoints by sending HTTP POST requests with mock event payloads matching the unit tests.

## Customize redaction rules

In [`functions/index.js`](functions/index.js), you can customize:

- **InfoTypes**: Add or remove infoTypes (such as `PERSON_NAME`, `CREDIT_CARD_NUMBER`, `US_SOCIAL_SECURITY_NUMBER`, or `PASSPORT`) in `inspectConfig.infoTypes`.
- **Transformations**: Change `primitiveTransformation` from `replaceWithInfoTypeConfig: {}` to:
  - `replaceConfig: { newValue: { stringValue: "[REDACTED]" } }` to use a generic replacement token.
  - Character masking (for example, masking all but the last 4 digits of a number).
  - Cryptographic hash or tokenization.
- **Pre-configured templates**: For production environments, consider creating Cloud Sensitive Data Protection inspection and de-identification templates in the Google Cloud Console. You can configure `inspectTemplateName` and `deidentifyTemplateName` in `dlp.deidentifyContent(...)` to manage rules centrally without changing function code.

## License

© Google, 2024. Licensed under an [Apache-2.0](../../LICENSE) license.
