# Firebase AI Logic: Redact Sensitive Data with Cloud Sensitive Data Protection (2nd Gen)

This sample demonstrates how to use **Firebase AI Logic triggers** (available in `firebase-functions` 7.4.0 and later) in conjunction with [**Cloud Sensitive Data Protection (DLP)**](https://cloud.google.com/security/products/sensitive-data-protection) to automatically inspect and redact sensitive data (PII) **before** sending prompts to the Gemini API and **after** receiving responses from the model.

## Introduction

[Firebase AI Logic triggers](https://firebase.google.com/docs/ai-logic/pre-and-post-request-scripts) allow you to run custom server-side scripts that intercept every `generateContent` request sent to the Gemini API via Firebase AI Logic — *without modifying your client application code*.

This sample implements two 2nd Gen Cloud Functions:

1. **`redactPrompt` (`beforeGenerateContent`)**:
   Runs *before* a request reaches the Gemini API. It inspects all text parts in the prompt's `contents` (as well as `systemInstruction`, if present) for sensitive information (such as email addresses, phone numbers, credit card numbers, and US social security numbers) and replaces them with standard infoType placeholders (e.g., `[EMAIL_ADDRESS]`, `[PHONE_NUMBER]`). If sensitive data was found, the function returns the modified request. If no sensitive data was detected, it returns without modifying the request.

2. **`redactResponse` (`afterGenerateContent`)**:
   Runs *after* the Gemini API returns a response and *before* that response is returned to the client app. It inspects the generated text in the response `candidates` for sensitive information and redacts any matching tokens.

### Request Flow

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

## Documentation Region Tags (`includecode`)

This sample provides region tags formatted for use with DevSite `includecode` in the Firebase AI Logic documentation ([pre-and-post-request-scripts.md](https://firebase.google.com/docs/ai-logic/pre-and-post-request-scripts)):

| Region Tag | Description |
| --- | --- |
| `ai_logic_imports` | Imports from `firebase-functions`, `firebase-functions/v2/ai`, and `@google-cloud/dlp`. |
| `ai_logic_redact_helper` | The `redactSensitiveData` utility function that calls `dlp.deidentifyContent(...)`. |
| `ai_logic_before_generate_content` | The `redactPrompt` pre-request trigger (`beforeGenerateContent`). |
| `ai_logic_after_generate_content` | The `redactResponse` post-request trigger (`afterGenerateContent`). |
| `ai_logic_pre_request` | Self-contained pre-request snippet including imports, DLP helper, and `beforeGenerateContent` trigger. |
| `ai_logic_sensitive_data_all` | Complete end-to-end sample containing imports, helper, and both triggers. |

To reference these snippets in Firebase DevSite documentation:

```markdown
<!-- Pre-request function snippet -->
{% includecode github_path="firebase/functions-samples/Node/ai-logic-sensitive-data/functions/index.js" region_tag="ai_logic_before_generate_content" adjust_indentation="auto" %}

<!-- Post-request function snippet -->
{% includecode github_path="firebase/functions-samples/Node/ai-logic-sensitive-data/functions/index.js" region_tag="ai_logic_after_generate_content" adjust_indentation="auto" %}
```

## Prerequisites

1. A **Firebase Project** upgraded to the [Blaze "pay-as-you-go" plan](https://firebase.google.com/pricing).
2. [Firebase CLI](https://firebase.google.com/docs/cli) installed and authenticated:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
3. Enable the **Cloud Sensitive Data Protection API** (formerly Cloud DLP):
   ```bash
   gcloud services enable dlp.googleapis.com --project=YOUR_PROJECT_ID
   ```
4. **Grant IAM Permissions**:
   - The default compute / Cloud Build service account requires the Cloud Build Service Account role:
     ```bash
     gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
       --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
       --role="roles/cloudbuild.builds.builder"
     ```
   - The Cloud Functions runtime service account requires permissions to invoke Cloud Sensitive Data Protection:
     ```bash
     gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
       --member="serviceAccount:YOUR_PROJECT_ID@appspot.gserviceaccount.com" \
       --role="roles/dlp.user"
     ```

## Setup & Deployment

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

## Local Testing & Verification

The sample includes an automated unit test suite using Node.js's native test runner (`node:test`). The tests mock the Cloud Sensitive Data Protection client to verify:
- Sensitive infoTypes (emails, phone numbers, credit cards, SSNs) are properly detected and redacted.
- Non-sensitive text and non-text parts (e.g., inline images) are preserved untouched.
- Handlers return undefined when no sensitive data is detected, leaving requests and responses untouched.
- Proper handling of string and object `systemInstruction`.
- Both Gemini Developer API (`geminiV1Beta`) and Vertex AI (`vertexV1Beta1`) request structures.

To run the unit tests:

```bash
cd functions
npm test
```

## Customizing Redaction Rules

In [`functions/index.js`](functions/index.js), you can customize:

- **InfoTypes**: Add or remove infoTypes (such as `PERSON_NAME`, `PASSPORT`, `IP_ADDRESS`, `STREET_ADDRESS`) in `inspectConfig.infoTypes`.
- **Transformations**: Change `primitiveTransformation` from `replaceWithInfoTypeConfig: {}` to:
  - `replaceConfig: { newValue: { stringValue: "[REDACTED]" } }` to use a generic replacement token.
  - Character masking (e.g. masking all but the last 4 digits of a card number).
  - Cryptographic hash or tokenization.
- **DLP Templates**: Use pre-configured Cloud SDP templates in Google Cloud Console with `inspectTemplateName` and `deidentifyTemplateName`.

## License

© Google, 2024. Licensed under an [Apache-2.0](../../LICENSE) license.
