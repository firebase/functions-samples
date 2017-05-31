/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const functions = require('firebase-functions');
const firebase = require('firebase');
const app = require('express')();
const React = require('react');
const ReactDOMServer = require('react-dom/server');

// React App
const ServerApp = React.createFactory(require('./build/server.bundle.js').default);
const template = require('./template');

// Server-side Data Loading
const appConfig = functions.config().firebase;
const database = require('./firebase-database');
database.initializeApp(appConfig);

// Helper function to get the markup from React, inject the initial state, and
// send the server-side markup to the client
const renderApplication = (url, res, initialState) => {
  const html = ReactDOMServer.renderToString(ServerApp({url: url, context: {}, initialState, appConfig }));
  const templatedHtml = template({ body: html, initialState: JSON.stringify(initialState)});
  res.send(templatedHtml);
};

app.get('/favicon.ico', function(req, res) {
    res.send(204);
});

app.get('/:userId?', (req, res) => {
  res.set('Cache-Control', 'public, max-age=60, s-maxage=180');
  if (req.params.userId) {
    // client is requesting user-details page with userId
    // load the data for that employee and its direct reports
    database.getEmployeeById(req.params.userId).then((resp) => {
      renderApplication(req.url, res, resp);
    });
  } else {
    // index page. load data for all employees
    database.getAllEmployees().then((resp) => {
      renderApplication(req.url, res, resp);
    });
  }
});

exports.app = functions.https.onRequest(app);
