import * as functions from 'firebase-functions'

// if you need to use the Firebase Admin SDK, uncomment the following:
// import * as admin from 'firebase-admin'


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
export let helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!\n\n");
});
