#!/usr/bin/env node
/**
 * This script helps you set up your environment to run this demo in the
 * emulator or deploy it to Cloud Functions and Hosting. Its use is optional;
 * see the README for manual setup hints.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const process = require('process');
const readline = require('readline');

const DEPLOYING = process.argv.length >= 3 && process.argv[2] === '-d';
const GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || '<YOUR_PROJECT_ID>';
const PROJECT_DIR = process.env.PROJECT_DIR || __dirname;

const OKTA_URL_PROMPT = `\
What is your Okta organization URL?

You can find it in the top-right corner of the Dashboard page of the Okta \
developer console.
> `;

const OKTA_CLIENT_ID_PROMPT = `\
What is your web app's Okta client ID?

You can find it on the Applications page of the Okta developer console.
> `;

const CORS_ORIGIN = `\
What is the base URL where you'll be hosting your web app?

For example: https://${GCLOUD_PROJECT}.web.app
> `;

const SERVICE_ACCOUNT_PATH_PROMPT = `\
What is the full path to your service account key file?

You can download your project's service account key from the Firebase console:
https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk

Note that this value is required only when using the emulator.
> `;

const EXAMPLE_ENDPOINT = (
        DEPLOYING ? `
When you deploy the Cloud Function. the endpoint looks like:
https://<YOUR_PROJECT_AND_LOCATION>.cloudfunctions.net/api/firebaseCustomToken`
        : `
When using the emulator, the endpoint is the following:
http://localhost:5001/${GCLOUD_PROJECT}/us-central1/api/firebaseCustomToken`
);

const TOKEN_ENDPOINT_PROMPT = `\
What is the URL of your '/api/firebaseCustomToken' endpoint?
${EXAMPLE_ENDPOINT}
> `;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('SIGINT', () => {
    process.exit(1);
});

const ask = (question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            console.log();
            resolve(answer);
        });
    });
};

(async () => {
    let oktaOrgUrl = null;
    let oktaClientId = null;
    let corsOrigin = null;
    let tokenEndpoint = null;
    let serviceAccountFile = null;

    console.log(DEPLOYING ? 'Checking configuration for deployment...'
                          : 'Checking configuration for emulation...');

    const oktaConfigJs = 'public/okta-config.js';
    try {
        fs.accessSync(`${PROJECT_DIR}/${oktaConfigJs}`);
        console.log(`Found ${oktaConfigJs}. Skipping setup.`);
    } catch {
        console.log(`Can't find ${oktaConfigJs}. Configuring...\n`)
        oktaOrgUrl = oktaOrgUrl || await ask(OKTA_URL_PROMPT);
        oktaClientId = oktaClientId || await ask(OKTA_CLIENT_ID_PROMPT);
        tokenEndpoint = tokenEndpoint || await ask(TOKEN_ENDPOINT_PROMPT);
        const contents = `\
//
// Configuration for Okta/Firebase demo client (index.html)
//

// Okta org URL, from the Dashboard page of the Okta developer console.
const OKTA_ORG_URL = '${oktaOrgUrl}';

// Okta client ID, from the Application page of the Okta developer console.
const OKTA_CLIENT_ID = '${oktaClientId}';

// The complete URL of your custom token endpoint. When using the emulator, the
// endpoint is:
// http://localhost:5001/<YOUR_FIREBASE_PROJECT_ID>/us-central1/api/firebaseCustomToken
const CUSTOM_TOKEN_ENDPOINT = '${tokenEndpoint}';

if (OKTA_ORG_URL === ''
    || OKTA_CLIENT_ID === ''
    || CUSTOM_TOKEN_ENDPOINT === '') {
    console.error('Okta configuration not set in okta-config.js.')
}        
`;
        fs.writeFileSync(`${PROJECT_DIR}/${oktaConfigJs}`, contents);
    }

    if (DEPLOYING) {
        try {
            const envCfgJson = execSync('firebase functions:config:get');
            const envCfg = JSON.parse(envCfgJson);
            if (!envCfg.okta_auth
                    || !envCfg.okta_auth.org_url
                    || !envCfg.okta_auth.cors_origin) {
                console.log('Cloud Functions environment not configured. '
                            + 'Configuring...');
                oktaOrgUrl = oktaOrgUrl || await ask(OKTA_URL_PROMPT);
                corsOrigin = corsOrigin || await ask(CORS_ORIGIN);
                execSync(`firebase functions:config:set\
                            okta_auth.org_url=${oktaOrgUrl}\
                            okta_auth.cors_origin=${corsOrigin}`);
            } else {
                console.log('Cloud Functions environment configuration found. '
                            + 'Skipping setup.');
            }
        } catch {
            console.error('Couldn\'t set up the Cloud Functions environment. '
                          + 'Try again or set okta_auth.org_url and '
                          + 'okta_auth.cors_origin manually with \'firebase '
                          + 'functions:config:set\'');
        }

        rl.close();
        return;
    }

    // Skip the rest if we're deploying for real.

    const runtimeconfigJson = '.runtimeconfig.json';
    try {
        fs.accessSync(`${PROJECT_DIR}/${runtimeconfigJson}`);
        console.log(`Found ${runtimeconfigJson}. Skipping setup.`);
    } catch {
        console.log(`Can't find ${runtimeconfigJson}. Configuring...\n`)
        oktaOrgUrl = oktaOrgUrl || await ask(OKTA_URL_PROMPT);
        const contents = `{ "okta_auth.org_url": "${oktaOrgUrl}" }\n`;
        fs.writeFileSync(`${PROJECT_DIR}/${runtimeconfigJson}`, contents);
    }

    const dotEnv = 'functions/.env';
    try {
        fs.accessSync(`${PROJECT_DIR}/${dotEnv}`);
        console.log(`Found ${dotEnv}. Skipping setup.`);
    } catch {
        console.log(`Can't find ${dotEnv}. Configuring...\n`)
        serviceAccountFile =
                serviceAccountFile || await ask(SERVICE_ACCOUNT_PATH_PROMPT);
        const contents =
                `GOOGLE_APPLICATION_CREDENTIALS="${serviceAccountFile}"\n`;
        fs.writeFileSync(`${PROJECT_DIR}/${dotEnv}`, contents);
    }

    rl.close();
})();
