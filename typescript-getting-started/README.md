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

TypeScript supports targeting different browsers, and optimizes
the resulting JavaScript. It is much easier to write clean, consistent code
across a project and development team.  TypeScript offers support for the
latest and evolving JavaScript features like async functions and decorators,
to help build robust components.

If you are new to TypeScript, check out the [TypeScript PlayGround](https://www.typescriptlang.org/play/index.html).


### Project Setup

This project was set up using [yarn](https://yarnpkg.com) which will ensure
that your deployed Cloud Functions are using the exact same versions of
npm modules that you are running locally. The specific version of each
dependency is saved in [yarn.lock](functions/yarn.lock)


This example has the default sample function. To use this example as a
starter project:

1. `npm install -g firebase-tools`
2. `git clone https://github.com/firebase/functions-samples.git`
3. Create a Firebase Project using the Firebase Developer Console
4. Make a directory for your project and cd into it. Then initialize
   the Firebase project and replace the default functions directory with
   this one. The directory name doesn't have to be the same as your
   Firebase project name -- that's just common practice. In the following
   steps a shell variable is used to make it simple to change the first line:
   ```
   PROJECT=your-project-name
   mkdir $PROJECT; cd $PROJECT
   firebase init
   firebase --use add $PROJECT
   rm -rf functions
   cp -r ../functions-samples/typescript-getting-started/functions functions
   ```
5. Install the dependencies and deploy
   ```
   cd functions
   yarn     # or npm install
   npm run deploy
   ```

Note: with TypeScript you need to build the JavaScript files before
deploying, so there's an npm script that does the steps.  You can see
that and a few other handy shortcuts in [package.json](functions/package.json)

After the deploy is complete, you will see output with the URL of your
Cloud Function endpoint. You can test the function with curl.
```
curl https://us-central1-YOUR-PROJECT-NAME.cloudfunctions.net/helloWorld
```
