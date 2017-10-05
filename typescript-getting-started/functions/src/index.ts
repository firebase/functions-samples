import * as functions from 'firebase-functions'

// if you need to use the Firebase Admin SDK, uncomment the following:
// import * as admin from 'firebase-admin'


// Create and Deploy Cloud Function with TypeScript using script that is
// defined in functions/package.json:
//    cd functions
//    npm run deploy

export let helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!\n\n");
});
