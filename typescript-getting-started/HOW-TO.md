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
Functions and whatever other features you want to use. Choose Typescript as the language you want to use for your functions and then type "n" when
prompted to install dependencies with npm.
4. The project will be automatically created with a ready-to-use Typescript enabled project. Your source code will go into the `functions/src` directory and it will be compiled to the `functions/lib` directory when running the Typescript compiler.
5. To compile your source code you can run `npm run build` from the functions directory. Also note that a pre-deploy trigger has been added so that your source code is automatically compiled before each deployment when running `firebase deploy`.
6. install dependencies with npm (still in `functions` directory)
```
npm install
```

Note: if you want to just start using TypeScript gradually, you can target
"es5" and the compiler will allow you to intermix old-school JavaScript
and TypeScript.


7. I like to exclude node_modules and compiled js files from git, so
I add this to a root level `.gitignore` file

```
node_modules/

## ignore generated JavaScript files
functions/**/*.js
functions/**/*.js.map
```

8. in `functions` directory, use the npm deploy script to deploy your functions:
```
npm run deploy
```
You will see a bunch of output and at the end it will show you the URL for your deployed function.

9. test YOUR function with curl. For mine I can do this:
```
curl https://us-central1-functions-typescript.cloudfunctions.net/helloWorld
```

Now start developing in TypeScript!

Initial steps were based on [nice article](https://medium.com/@wcandillon/writing-cloud-functions-with-typescript-61d86e282752) by [@wcandillon](https://twitter.com/wcandillon)
