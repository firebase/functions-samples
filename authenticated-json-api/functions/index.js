/**
 * Copyright 2017 Google Inc. All Rights Reserved.
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

'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Language = require('@google-cloud/language');
const express = require('express');

const app = express();
const language = new Language({projectId: process.env.GCLOUD_PROJECT});

admin.initializeApp(functions.config().firebase);

// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.
const authenticate = (req, res, next) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    res.status(403).send('Unauthorized');
    return;
  }
  const idToken = req.headers.authorization.split('Bearer ')[1];
  admin.auth().verifyIdToken(idToken).then(decodedIdToken => {
    req.user = decodedIdToken;
    return next();
  }).catch(error => {
    res.status(403).send('Unauthorized');
  });
};

app.use(authenticate);

// POST /api/messages
// Create a new message, get its sentiment using Google Cloud NLP,
// and categorize the sentiment before saving.
app.post('/messages', (req, res) => {
  const message = req.body.message;

  language.detectSentiment(message).then(results => {
    const category = categorizeScore(results[0].score);
    const data = {message: message, sentiment: results, category: category};
    return admin.database().ref(`/users/${req.user.uid}/messages`).push(data);
  }).then(snapshot => {
    return snapshot.ref.once('value');
  }).then(snapshot => {
    const val = snapshot.val();
    return res.status(201).json({message: val.message, category: val.category});
  }).catch(error => {
    console.log('Error detecting sentiment or saving message', error.message);
    res.sendStatus(500);
  });
});

// GET /api/messages?category={category}
// Get all messages, optionally specifying a category to filter on
app.get('/messages', (req, res) => {
  const category = req.query.category;
  let query = admin.database().ref(`/users/${req.user.uid}/messages`);

  if (category && ['positive', 'negative', 'neutral'].indexOf(category) > -1) {
    // Update the query with the valid category
    query = query.orderByChild('category').equalTo(category);
  } else if (category) {
    return res.status(404).json({errorCode: 404, errorMessage: `category '${category}' not found`});
  }

  return query.once('value').then(snapshot => {
    var messages = [];
    snapshot.forEach(childSnapshot => {
      messages.push({key: childSnapshot.key, message: childSnapshot.val().message});
    });

    return res.status(200).json(messages);
  }).catch(error => {
    console.log('Error getting messages', error.message);
    res.sendStatus(500);
  });
});

// GET /api/message/{messageId}
// Get details about a message
app.get('/message/:messageId', (req, res) => {
  const messageId = req.params.messageId;
  admin.database().ref(`/users/${req.user.uid}/messages/${messageId}`).once('value').then(snapshot => {
    if (snapshot.val() === null) {
        return res.status(404).json({errorCode: 404, errorMessage: `message '${messageId}' not found`});
    }
    return res.set('Cache-Control', 'private, max-age=300');
  }).catch(error => {
    console.log('Error getting message details', messageId, error.message);
    res.sendStatus(500);
  });
});

// Expose the API as a function
exports.api = functions.https.onRequest(app);

// Helper function to categorize a sentiment score as positive, negative, or neutral
const categorizeScore = score => {
  if (score > 0.25) {
    return 'positive';
  } else if (score < -0.25) {
    return 'negative';
  }
  return 'neutral';
};
