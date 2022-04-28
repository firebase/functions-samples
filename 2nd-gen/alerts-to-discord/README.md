# Quickstart: Send Firebase Alerts to Discord

This quickstart demonstrates how to trigger a function based on a Firebase Alert, and send information about the alert to a channel in a Discord server.

## Functions
The sample code consists of 2 functions:

## Setup and Deploy

### Discord Webhook URL

The sample uses [Discord Webhooks](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks) to send alerts to a Discord channel. You'll need to create a Webhook and hook it up the function by [creating a secret](https://firebase.google.com/docs/functions/config-env#secret-manager):

1. Follow the "MAKING A WEBHOOK" instructions in the [Discord docs](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks). 
1. Copy the Webhook URL
1. Save the Webhook URL as a secret:
    ```bash
    $ firebase functions:secrets:set DISCORD_WEBHOOK_URL
    ? Enter a value for DISCORD_WEBHOOK_URL [input is hidden]
    ✔  Created a new secret version projects/XXX/secrets/DISCORD_WEBHOOK_URL/versions/1
    ```

### Deploy
Deploy functions using Firebase CLI:

```bash
$ firebase deploy
```

