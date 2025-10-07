# Send in-app feedback to Jira

This [code](functions/main.py) demonstrates how to use a Firebase Cloud Function triggered by an
[in-app feedback Firebase Alert from App Distribution](https://firebase.google.com/docs/functions/beta/reference/firebase-functions.alerts.appdistribution.inappfeedbackpayload),
and stores the feedback details (including screenshot) in Jira.

You can customize this code to work with your own Jira configuration (eg on-premise support, custom issue types, etc).

## Quickstart

This sample code uses Jira's built-in APIs to create issues for in-app tester feedback. For simplicity it uses [basic authorization](https://developer.atlassian.com/cloud/jira/platform/basic-auth-for-rest-apis/).

1. [Generate an API token](https://id.atlassian.com/manage-profile/security/api-tokens) via your Jira profile.


   Note: If the tester who files feedback does not have a Jira account, the user who generates this token will be marked as the issue's reporter.
2. This [code](functions/main.py) uses [parameterized configuration](https://firebase.google.com/docs/functions/config-env#params) to prompt for the required configuratio. To start the process, run:
   ```bash
   $ firebase deploy
   ```
   This will store the `API_TOKEN` using [Google Cloud Secret Manager](https://cloud.google.com/secret-manager) and the remaining settings in an `.env` file which will contain the following variables, customized to your Jira project:
    ```bash
    JIRA_URI="<your JIRA instance's URI, e.g. 'https://mysite.atlassian.net'>"
    PROJECT_KEY="<your project's key, e.g. 'DEV'>"
    ISSUE_TYPE_ID="<issue type ID; defaults to '10001' (Improvement)>"
    ISSUE_LABEL="<label applied to the Jira issues created; defaults to 'in-app'>"
    API_TOKEN_OWNER="<creator of the token; default reporter of issues>"
    ```

## License
© Google, 2022. Licensed under an [Apache-2 license](../../LICENSE).