/**
 * Implements the `/api/firebaseCustomToken` endpoint, which is responsible for
 * validating Okta access tokens and minting Firebase custom authentication
 * tokens.
 */
require('dotenv').config()  // Only needed for local testing.

const express = require('express');
const app = express();

const functions = require('firebase-functions');
const firebaseAdmin = require('firebase-admin');
const firebaseApp = firebaseAdmin.initializeApp();

const OKTA_ORG_URL = functions.config().okta_auth.org_url
const OktaJwtVerifier = require('@okta/jwt-verifier');
const oktaJwtVerifier = new OktaJwtVerifier({
    issuer: `${OKTA_ORG_URL}/oauth2/default`
});

// Update CORS_ORIGIN to the base URL of your web client before deploying or
// using a non-standard emulator configuration.
const CORS_ORIGIN = functions.config().okta_auth.cors_origin ||
                    'http://localhost:5000';
const cors = require('cors')({ origin: CORS_ORIGIN });

// Middleware to authenticate requests with an Okta access token.
// https://developer.okta.com/docs/guides/protect-your-api/nodeexpress/require-authentication/
const oktaAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/Bearer (.+)/);
  
    if (!match) {
        res.status(401);
        return next('Unauthorized');
    }
  
    const accessToken = match[1];
    try {
        const jwt = await oktaJwtVerifier.verifyAccessToken(
                accessToken, 'api://default');
        req.jwt = jwt;
        return next();
    } catch (err) {
        console.log(err.message);
        res.status(401);
        return next('Unauthorized');
    }
}

// Get a Firebase custom auth token for the authenticated Okta user.
app.get('/firebaseCustomToken', [cors, oktaAuth], async (req, res) => {
    const oktaUid = req.jwt.claims.uid;
    try {
        const firebaseToken =
                await firebaseApp.auth().createCustomToken(oktaUid);
        res.send(firebaseToken);
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Error minting token.');
    }
});

// Enable CORS pre-flight requests.
app.options('/firebaseCustomToken', cors);

exports.api = functions.https.onRequest(app);
