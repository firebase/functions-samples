// Generated file. Do not edit.
// Bundled from web/app.js

const String appJs = r'''
"use strict";
// Initialize Firebase with placeholder config for prod
firebase.initializeApp({
    apiKey: "demo-api-key",
    authDomain: "demo-project.firebaseapp.com",
    projectId: "demo-project",
});
// Connect to Auth Emulator if running locally
if (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1") {
    firebase.auth().useEmulator("http://" + window.location.hostname + ":9099");
}
let currentIdToken = "";
firebase.auth().onIdTokenChanged(async (user) => {
    if (user) {
        currentIdToken = await user.getIdToken();
    }
    else {
        currentIdToken = "";
    }
});
// Configure HTMX to attach Authorization header
document.body.addEventListener("htmx:configRequest", (event) => {
    if (currentIdToken) {
        event.detail.headers["Authorization"] = "Bearer " + currentIdToken;
    }
});
// Sign In Logic for HTML Form
window.signInWithEmailPassword = async (event) => {
    event.preventDefault();
    const emailInput = document.getElementById("email");
    const passInput = document.getElementById("password");
    const errorDiv = document.getElementById("login-error");
    const email = emailInput.value;
    const pass = passInput.value;
    try {
        errorDiv.innerText = "";
        await firebase.auth().signInWithEmailAndPassword(email, pass);
        window.location.href = "?";
    }
    catch (error) {
        if (error.code === "auth/user-not-found") {
            try {
                // Automatically create the demo user in the emulator
                await firebase.auth().createUserWithEmailAndPassword(email, pass);
                window.location.href = "?";
            }
            catch (createError) {
                errorDiv.innerText = "Error creating demo user: " + createError.message;
            }
        }
        else {
            errorDiv.innerText = "Sign in error: " + error.message;
        }
    }
};
// Sign Out Logic
window.signOut = async () => {
    await firebase.auth().signOut();
    window.location.href = "?mode=signin";
};
''';
