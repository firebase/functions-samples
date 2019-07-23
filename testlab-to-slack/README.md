# Post Test Lab Results to Slack channel

This sample demonstrates how to post to a Slack channel in response to the
completion of a test matrix in **Firebase Test Lab**. The message will look like
this:

![example Slack message with Test Lab status](https://i.imgur.com/9DTL19x.png)

## Setting up the sample

1.  [Create a Slack app](https://api.slack.com/slack-apps#creating_apps)
1.  Visit Slack's [_Your Apps_](https://api.slack.com/apps) page, select your
    app, and click _OAuth & Permissions_ on the left side of the page.

    1. Under the _Scopes_ header, type in `chat:write:bot` and add the scope to
       your app. Click _Save Changes_

    1. Under the _OAuth Tokens & Redirect URLs_ header, click the _Install App_
       button. Once you've installed the app to your Workspace and you're
       returned to the page with _OAuth Tokens & Redirect URLs_, copy the _OAuth
       Access Token_ that was automatically created when your app was installed.
       You'll need this later so your function can authenticate with Slack.

1.  [Get the ID](https://stackoverflow.com/questions/40940327/what-is-the-simplest-way-to-find-a-slack-team-id-and-a-channel-id)
    of the channel you want your Slack app to post to. You'll need this later so
    your function can post to the correct channel.
1.  Clone or download this repo and open this directory in a terminal:

    ```shell
    cd testlab-to-slack
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

    ```
    firebase functions:config:set slack.token="YOUR_SLACK_OAUTH_TOKEN" slack.channelid="ID_OF_YOUR_SLACK_CHANNEL"
    ```

## Deploy and test

This sample comes with a web-based UI for testing the function. To test it out:

1.  Deploy your function using `firebase deploy --only functions`
1.  Navigate to the
    [Test Lab](https://console.firebase.google.com/u/0/project/_/testlab/histories)
    section of the Firebase Console and start a test.
1.  Once the test finishes running, check your Slack channel and view the new
    post!
