# Post Test Lab Results to Slack channel

This sample demonstrates how to post to a Slack channel in response to the
completion of a Test Matrix in Firebase Test Lab. The message will look like
this:

![example Slack message with Test Lab status](https://i.imgur.com/9DTL19x.png)

## Setting up the sample

1.  [Add an **Incoming Webhook**](https://my.slack.com/services/new/incoming-webhook/) to your Slack channel and take note of the **Webhook URL**.
1.  Clone or download this repo and open this directory in a terminal:

    ```shell
    cd 2nd-gen/testlab-to-slack
    ```

1.  You must have the latest Firebase CLI installed. If you don't have it,
    install it with `npm install -g firebase-tools` and then sign in with
    `firebase login`.
1.  Configure the CLI locally by using `firebase use --add` and select your
    project in the list.
1.  Install Cloud Functions dependencies locally by running:
    `cd functions; npm install; cd -`
1.  Set the following environment variables so that the function can
    authenticate with Slack and post to the correct room:

    ```bash
    firebase functions:secrets:set SLACK_WEBHOOK_URL
    ```
    
    Enter the value of your Slack url to save it into Secret Manager.

## Deploy and test

This sample comes with a web-based UI for testing the function. To test it out:

1.  Deploy your function using `firebase deploy --only functions`
1.  Navigate to the
    [Test Lab](https://console.firebase.google.com/u/0/project/_/testlab/histories)
    section of the Firebase Console and start a test.
1.  Once the test finishes running, check your Slack channel and view the new
    post!
