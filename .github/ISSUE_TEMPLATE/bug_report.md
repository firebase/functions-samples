---
name: Bug report
about: Report an issue with a specific sample
title: '[BUG] in sample: '
labels: 'type: bug'
assignees: ''
---

### Which sample has a bug?

**Sample name or URL where you found the bug**

### How to reproduce the issue

**Failing Function code used (if you modified the sample)**

**Steps to set up and reproduce**

<!-- Help us diagnose the issue. Please provide detailed instructions to run your minimal repro or to recreate the environment -->

### Versions

<!-- Many reports turn out to be version-specific, so this saves a round trip. -->

**`firebase-functions` and `firebase-admin`** (the installed versions: run `npm ls firebase-functions firebase-admin` in the sample's `functions` directory, or `pip show firebase-functions firebase-admin` for Python)

**Firebase CLI** (run `firebase --version`; only needed if the problem shows up when you deploy or in the emulator)

**Node.js or Python** (run `node --version` or `python --version`)

### Debug output

<!-- Provide any error messages or screenshots of unexpected behavior -->

**Errors in the
[console logs](https://console.firebase.google.com/project/_/functions/logs?search=&severity=DEBUG)**

**Screenshots**

### Expected behavior

<!-- What is the expected behavior? -->

### Actual behavior

<!-- What is the actual behavior? -->
