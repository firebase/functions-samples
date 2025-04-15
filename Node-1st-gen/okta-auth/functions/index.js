/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Implements the `/api/firebaseCustomToken` endpoint, which is responsible for
 * validating Okta access tokens and minting Firebase custom authentication
 * tokens.
 */
const express = require("express");
const app = express();

// For local testing, use GOOGLE_APPLICATION_CREDENTIALS from `.env` instead of
// the value set by the emulator. Generate a .`env` file with `setup.js`, or
// create it manually.
const envCfg = require("dotenv").config();
if (envCfg.parsed && envCfg.parsed.GOOGLE_APPLICATION_CREDENTIALS) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS =
    envCfg.parsed.GOOGLE_APPLICATION_CREDENTIALS;
}

const functions = require("firebase-functions/v1");
const firebaseAdmin = require("firebase-admin");
const firebaseApp = firebaseAdmin.initializeApp();

const OKTA_ORG_URL = functions.config().okta_auth.org_url;
const OktaJwtVerifier = require("@okta/jwt-verifier");
const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: `${OKTA_ORG_URL}/oauth2/default`,
});

// Update CORS_ORIGIN to the base URL of your web client before deploying or
// using a non-standard emulator configuration.
const CORS_ORIGIN =
  functions.config().okta_auth.cors_origin || "http://localhost:5000";
const cors = require("cors")({ origin: CORS_ORIGIN });

// Middleware to authenticate requests with an Okta access token.
// https://developer.okta.com/docs/guides/protect-your-api/nodeexpress/require-authentication/
const oktaAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/Bearer (.+)/);

  if (!match) {
    res.status(401);
    return next("Unauthorized");
  }

  const accessToken = match[1];
  try {
    const jwt = await oktaJwtVerifier.verifyAccessToken(
      accessToken,
      "api://default",
    );
    req.jwt = jwt;
    return next();
  } catch (err) {
    functions.logger.log("Unable to verify Okta access token", err);
    res.status(401);
    return next("Unauthorized");
  }
};

// Get a Firebase custom auth token for the authenticated Okta user.
app.get("/firebaseCustomToken", [cors, oktaAuth], async (req, res) => {
  const oktaUid = req.jwt.claims.uid;
  try {
    const firebaseToken = await firebaseApp.auth().createCustomToken(oktaUid);
    res.send(firebaseToken);
  } catch (err) {
    functions.logger.error("Error minting token.", err);
    res.status(500).send("Error minting token.");
  }
});

// Enable CORS pre-flight requests.
app.options("/firebaseCustomToken", cors);

exports.api = functions.https.onRequest(app);
