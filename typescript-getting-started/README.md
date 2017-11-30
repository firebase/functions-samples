## Cloud Functions for Firebase: getting started with TypeScript

This is an example Firebase project for using
[TypeScript](https://www.typescriptlang.org/) with
[Cloud Functions for Firebase](https://firebase.google.com/products/functions)

### Why TypeScript?

[TypeScript](https://www.typescriptlang.org/) is a typed superset of JavaScript
that compiles to plain JavaScript.

One of the biggest challenges with developing in JavaScript is that it is
very easy to write code that has runtime errors. TypeScript enables the fast
development of JavaScript with optional types. When types are used,
supported editors provide auto-suggest for methods and properties along
with syntax highlighting of errors, which speeds development.

TypeScript supports targeting different browsers or node versions, and optimizes
the resulting JavaScript. It is much easier to write clean, consistent code
across a project and development team.  TypeScript offers support for the
latest and evolving JavaScript features like async functions and decorators,
to help build robust components.

For a nice intro to TypeScript, check out the [TypeScript PlayGround](https://www.typescriptlang.org/play/index.html).

### What is different about TypeScript in this example?

The TypeScript source is in `functions/src` and these files need to be compiled before deploying (see steps below).  The main Cloud Function entry
point is `src/index.ts` and it compiled to `lib/index.js` which is specified
in `functions/package.json`.

There are two key differences between the example Cloud Function in Typescript and ES2015:

* `require` -> `import`
* `exports.` -> `export const`

JavaScript:
```
const functions = require('firebase-functions');

exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send('Hello from Firebase!\n\n');
});
```

TypeScript:
```
import * as functions from 'firebase-functions'

export const helloWorld = functions.https.onRequest((request, response) => {
 response.send('Hello from Firebase!\n\n');
});
```


### Project Setup

This example has the default sample function. To use this example as a
starter project:

1. `npm install -g firebase-tools`
3. Create a Firebase Project using the Firebase Developer Console
2. Download the source code of this sample: `git clone https://github.com/firebase/functions-samples`
4. Enter the right sample directory: `cd functions-samples/typescript-getting-started`
5. Configure this project to use the Firebase project you have created: `firebase use --add` and select your project in the list.
6. Install the dependencies and deploy
   ```
   cd functions
   npm install
   npm run deploy
   ```

Note: with TypeScript you need to build the JavaScript files before
deploying, so an npm script does this steps.  You can see
that and a few other handy shortcuts in [package.json](functions/package.json).
Also a pre-deploy trigger ensures that the code is always transpied before deploying. You can see this in the [firebase.json](firebase.json).

After the deploy is complete, you will see output with the URL of your
Cloud Function endpoint. You can test the function with curl.  The following
command will work with any project, since the output of `firebase use` is
the current project ID:
```
curl https://us-central1-$(firebase use).cloudfunctions.net/helloWorld
```
