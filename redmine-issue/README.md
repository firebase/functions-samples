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

1. The code is triggered by an issue on Firebase Crashlytics
1. The list of available issue priorities is downloaded from Redmine
1. The best issue priority is found, based on Firebase Crashlytics issue settings and Redmine default issue priority
1. The issue is then created on Redmine

# Contribute

I've never done any Firebase Functions development so I have no idea if this is how things should be done. Any contribution welcome.

# License

```plain
Copyright 2018 Benoit Duffez

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

