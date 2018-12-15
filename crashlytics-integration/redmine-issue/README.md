# Firebase-Crashlytics-Redmine
Send issues to Redmine from Crashlytics using the Firebase functions

## What is this?

The legacy Crashlytics from Fabric will be replaced by the Fabric Crashlytics SDK.

Along with this, most service hooks will be left behind. There will be some (including JIRA), but none for Redmine.

This repository is a Firebase Functions script that will push Firebase Crashlytics issues to Redmine

## How to use

Setup Firebase Functions: https://firebase.google.com/docs/functions/get-started

* `npm install -g firebase-tools`
* `firebase login`

Configure the Redmine settings:

```
firebase functions:config:set redmine.api_key="THE API KEY"
firebase functions:config:set redmine.server_url="https://your.redmine.instance.com"
firebase functions:config:set redmine.project_id="your_project"
firebase functions:config:set redmine.issue_type=1
```

Deploy:

```
firebase deploy --only functions
```

## What does it do?

Once you have configured the API key (please create a dedicated user for that), server URL, project identifier (numeric or string) and the issue type (tracker, by default 1=Bug):

1. The code is triggered when a new issue is created on Firebase Crashlytics
1. The list of available issue priorities is downloaded from Redmine
1. The best issue priority is found, based on Firebase Crashlytics issue settings and Redmine default issue priority
1. The issue is then created on Redmine

# Contribute

We'd love that you contribute to the project. Before doing so please read our [Contributor guide](../CONTRIBUTING.md).

# License

© Google, 2017. Licensed under an [Apache-2](../LICENSE) license.

