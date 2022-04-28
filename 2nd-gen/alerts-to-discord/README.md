# Quickstart: Send Firebase Alerts to Discord

This quickstart demonstrates how to trigger a function based on a Firebase Alert, and send information about the alert to a channel in a Discord server.

## Functions
The sample code consists of 2 functions:

## Set up and Deploy

### Discord Webhook URL

The sample uses [Discord Webhooks](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks) to send alerts to a Discord channel. You'll need to create a Webhook and hook it up the function by [creating an environment variable](https://firebase.google.com/docs/functions/config-env#env-variables):

1. Follow the "MAKING A WEBHOOK" instructions in the [Discord docs](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks). 
1. Copy the Webhook URL
1. Create a `.env` file in the `functions` directory
1. Add the `DISCORD_WEBHOOK_URL` variable and set it to your Webhook URL:
    ```bash
    DISCORD_WEBHOOK_URL="<your webhook url>"
    ```

### Deploy
Deploy functions using the Firebase CLI:

```bash
$ firebase deploy
```

## License

© Google, 2022. Licensed under an [Apache-2](../../../LICENSE) license.

