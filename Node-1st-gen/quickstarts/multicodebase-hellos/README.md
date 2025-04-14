# Firebase SDK for Cloud Functions Quickstart - Multi-codebases

This quickstart demonstrates how to set up a multi-codebase repository that allows you to setup multiple source directories to manage your function definitions.

## Setup

This repository contains 2 different function sources:

- `/js`: Contains a function sample written in JavaScript.
- `/ts`: Contains a function sample written in Typescript.

We define function configuration for each source directory in `firebase.json`:

```json
{
  "functions": [
    {
      "source": "js",
      "codebase": "javascript"
    },
    {
      "source": "ts",
      "codebase": "typescript"
    }
  ]
}
```

## Deploying

Make sure you are using the latest Firebase CLI. Multi-codebase support is only available in Firebase CLI v10.7.0 and up.

```bash
npm install -g firebase-tools@latest
```

Deploy the sample functions using the Firebase CLI deploy command:

```bash
firebase deploy --only functions
```

You can also deploy a specific codebase:

```bash
firebase deploy --only functions:javascript
firebase deploy --only functions:typescript
```
