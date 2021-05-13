// Import and configure the Firebase SDK
// These scripts are made available when the app is served or deployed on Firebase Hosting
// If you do not serve/host your project using Firebase Hosting see https://firebase.google.com/docs/web/setup
importScripts('/__/firebase/8.6.1/firebase-app.js');
importScripts('/__/firebase/8.6.1/firebase-messaging.js');
importScripts('/__/firebase/init.js');

firebase.messaging();
