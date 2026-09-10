# Firebase SDK for Cloud Functions Quickstart - Auth triggers

This quickstart demonstrates how to setup an Auth triggered Cloud Function using the **Firebase SDK for Cloud Functions** and [Resend](https://resend.com/).


## Introduction

We'll deploy 2nd gen Auth triggered functions that send a welcome email when a new user signs up and a goodbye email when user accounts are deleted.

- [Read more about Cloud Functions for Firebase](https://firebase.google.com/docs/functions/)
- [Read more about the Firebase Local Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Connect Cloud Functions to the Emulator](https://firebase.google.com/docs/emulator-suite/connect_functions)


## Functions Code

The functions are organized into separate files for clean, self-contained documentation snippets and modular code:

- [functions/sendWelcomeEmail.js](functions/sendWelcomeEmail.js): `sendWelcomeEmail` triggers on all user creations across the project (default behavior).
- [functions/sendByeEmail.js](functions/sendByeEmail.js): `sendByeEmail` triggers when any user account is deleted.
- [functions/tenants.js](functions/tenants.js): Multi-tenancy examples:
  - `sendWelcomeEmailToTenant`: Scoped to users in a specific Identity Platform tenant using `tenantId: "my-tenant-id"`.
  - `sendWelcomeEmailNoTenant`: Triggers only for users not associated with any tenant using `tenantId: IS_NOT_TENANT`.
- [functions/utils/myEmailService.js](functions/utils/myEmailService.js): Configures the Resend client, defines the `EMAIL_API_KEY` secret, and provides the `sendEmail`, `sendWelcomeEmail`, and `sendGoodbyeEmail` helpers.
- [functions/index.js](functions/index.js): Entry point re-exporting all function triggers.

Sending emails is performed using [Resend](https://resend.com/). The dependencies are listed in [functions/package.json](functions/package.json).


## Set up the sample

1. Clone or download this repo and navigate to `Node/quickstarts/email-users`:
   ```bash
   cd Node/quickstarts/email-users
   ```
2. Install Cloud Functions dependencies:
   ```bash
   cd functions && pnpm install && cd ..
   ```
3. Set your Resend API key for local development in `functions/.env.local`:
   ```bash
   EMAIL_API_KEY="re_123456789"
   ```
   > You can obtain a free API key from [Resend](https://resend.com/api-keys).


## Run locally with the Firebase Emulator Suite

The [Firebase Local Emulator Suite](https://firebase.google.com/docs/emulator-suite) lets you test Auth triggers and create/delete users directly in the Emulator UI without deploying to a live project.

1. Start the emulators:
   ```bash
   firebase emulators:start
   ```
2. Open the **Emulator Suite UI** in your browser at [http://localhost:4000](http://localhost:4000) (or the port printed in your terminal).
3. Navigate to the **Authentication** tab.
4. **Trigger `sendWelcomeEmail`**: Click **Add user**, enter an email address and display name, and click **Save**.
5. **Trigger `sendByeEmail`**: Select the user you just created and click **Delete user**.
6. View the logs in the **Logs** tab of the Emulator Suite UI or in your terminal to see the functions execute:
   > `New welcome email sent to: user@example.com`  
   > `Account deletion confirmation email sent to: user@example.com`


## Deploy to production

To deploy the functions to a live Firebase project:

1. Configure your Firebase project:
   ```bash
   firebase use --add
   ```
2. Set your Resend API key as a Cloud Secret:
   ```bash
   firebase functions:secrets:set EMAIL_API_KEY
   ```
3. Deploy the functions:
   ```bash
   firebase deploy --only functions
   ```


## Contributing

We'd love that you contribute to the project. Before doing so please read our [Contributor guide](../../CONTRIBUTING.md).


## License

© Google, 2026. Licensed under an [Apache-2](../../LICENSE) license.
