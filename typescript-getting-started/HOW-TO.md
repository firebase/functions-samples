## Cloud Functions for Firebase: getting started with TypeScript

The following steps show how to set up TypeScript yourself starting
from scratch.



Steps:

1. Create a project in the [Firebase Console](https://console.firebase.google.com/)
in this example, I called mine `functions-typescript`
2. Create a directory for your project and do the following steps inside that
directory, for example:
   ```
    mkdir firebase-functions-typescript
    cd firebase-functions-typescript
   ```
2. Then to set up the firebase project
```
firebase init
```
3. You will be prompted to select the Firebase project you just created in the
Console UI and choose which Firebase features you want to use.  Select
Functions and whatever other features you want to use, then type "n" when
prompted to install dependencies with npm:
```
You're about to initialize a Firebase project in this directory:

  /Users/.../functions-typescript

? Which Firebase CLI features do you want to setup for this folder? Press Space to select features, then Enter
 to confirm your choices. Functions: Configure and deploy Cloud Functions

=== Project Setup

First, let's associate this project directory with a Firebase project.
You can create multiple project aliases by running firebase use --add,
but for now we'll just set up a default project.

i  .firebaserc already has a default project, skipping

=== Functions Setup

A functions directory will be created in your project with a Node.js
package pre-configured. Functions can be deployed with firebase deploy.

✔  Wrote functions/package.json
✔  Wrote functions/index.js
? Do you want to install dependencies with npm now? No

i  Writing configuration info to firebase.json...
i  Writing project information to .firebaserc...

✔  Firebase initialization complete!
```
4. create a `src` directory and move index.js into it (changing the suffix)
```
cd functions
mkdir src
mv index.js src/index.ts
```
5. add the following dev dependencies, scripts, and we'll be compiling the js
files in a directory called `build`, so we can specify where to start loading
JavaScript for Cloud Functions as `"main"` in functions/package.json
```
  "devDependencies": {
    "typescript": "^2.3.2"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "deploy": "tsc && firebase deploy --only functions"
  },
  "main": "build/index.js",
```

6. install dependencies with yarn (still in `functions` directory)
```
yarn install
```
7. create a `tsconfig.json` file:
```
{
  "compilerOptions": {
    "lib": ["es6", "es2015.promise"],
    "module": "commonjs",
    "noImplicitAny": false,
    "outDir": "build",
    "sourceMap": true,
    "target": "es6",
  },
  "include": [
    "src/**/*.ts",
    "spec/**/*.ts"
  ]
}
```

Note: if you want to just start using TypeScript gradually, you can target
"es5" and the compiler will allow you to intermix old-school JavaScript
and TypeScript.


8. I like to exclude node_modules and compiled js files from git, so
I add this to a root level `.gitignore` file

```
node_modules/

## ignore generated JavaScript files
functions/**/*.js
functions/**/*.js.map
```

9. in `index.ts` update the syntax to TypeScript (`require` -> `import` and
`exports.` -> `export let`)

```
import * as functions from 'firebase-functions'

export let helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!\n\n");
});
```

9. in `functions` directory, use the npm build script created
above to build TypeScript files and deploy:
```
npm run deploy
```
You will see a bunch of output and at the end it will show you the URL for your deployed function.

10. test YOUR function with curl. For mine I can do this:
```
curl https://us-central1-functions-typescript.cloudfunctions.net/helloWorld
```

Now start developing in TypeScript!

Initial steps were based on [nice article](https://medium.com/@wcandillon/writing-cloud-functions-with-typescript-61d86e282752) by [@wcandillon](https://twitter.com/wcandillon)
