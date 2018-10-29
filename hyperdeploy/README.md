# Deploy to Firebase static hosting with HyperDeploy

This template shows how to use the [HyperDeploy](https://github.com/stackblitz/core) library to programmatically deploy sites onto Firebase Hosting.

## Functions Code

See file [functions/index.js](functions/index.js) for the code.

This is done in two steps:

1. Write all desired files into dedicated FS location
2. Trigger a new deployment for desired project ID with a valid auth token (`firebase login:ci` or oAuth)

