# With Firebase Hosting and Docker example

## How to use

```bash
git clone https://github.com/firebase/functions-samples
cd with-firebase-hosting-and-docker
```

Set up firebase:

* create a project through the [firebase web console](https://console.firebase.google.com/)
* grab the projects ID from the web consoles URL: https://console.firebase.google.com/project/<projectId>
* update the `.env` with your FB_PROJECTID and FIREBASE_TOKEN ( see .env.example )
* ADD `serviceAccountKey.json` to your project root

### Dev next

```bash
yarn docker:dev
open http://localhost:5000
```

### Firebase serve

```bash
yarn docker:serve
open http://localhost:3000
```

### Firebase deploy

```bash
yarn docker:deploy
```

## The idea behind the example

The goal is to host the Next.js app on Firebase Cloud Functions with Firebase Hosting rewrite rules so our app is served from our Firebase Hosting URL, with docker support for a consistent development environment. Each individual page bundle is served in a new call to the Cloud Function which performs the initial server render. Docker is entirely dedicated for local development and the deployment process and that Firebase itself will not leverage Docker itself.

## Important

* The empty `placeholder.html` file is so Firebase Hosting does not error on an empty `public/` folder and still hosts at the Firebase project URL.
* `firebase.json` outlines the catchall rewrite rule for our Cloud Function.
* The [Firebase predeploy](https://firebase.google.com/docs/cli/#predeploy_and_postdeploy_hooks) hooks defined in `firebase.json` will handle linting and compiling of the next app and the functions sourceswhen `firebase deploy` is invoked. The only scripts you should need are `docker:dev`, `docker:serve` and `docker:deploy`.
