/**
 * Copyright 2015 Google Inc. All Rights Reserved.
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

// Create an all access Firebase Database reference.
var Firebase = require('firebase');
var env = require('./env');
var ref = new Firebase(env.get('firebase.database.url'), 'admin');
ref.auth(env.get('firebase.database.token'));

// Authenticate to gcloud.
// TODO: Make sure you add your Google Project ID, Private key and Email into the env.json file.
var gcloudconfig = {
  projectId: env.get('google.project_id'),
  credentials: {
    private_key: env.get('google.private_key'),
    client_email: env.get('google.client_email')
  }
};
var gcloud = require('gcloud')(gcloudconfig);
var bigquery = gcloud.bigquery();
// TODO: Change <YOUR-DATASET-NAME> with your BigQuery dataset name.
var dataset = bigquery.dataset('<YOUR-DATASET-NAME>');
// TODO: Change <YOUR-TABLE-NAME> with your BigQuery table name.
var table = dataset.table('<YOUR-TABLE-NAME>');

// Copies the Firebase Database element to BigQuery
function addtobigquery(context, data) {
  ref.child(data.path).once('value', function (snap) {
    table.insert({
      ID: snap.key(),
      MESSAGE: snap.val().message,
      NUMBER: snap.val().number
    }, function(err, insertErr, resp) {
      if (err) {
        console.log(err);
        context.done(err);
      } else if (insertErr) {
        console.log(insertErr);
        context.done(insertErr);
      } else {
        context.done();
      }
    });
  });
}

module.exports = {
  addtobigquery: addtobigquery
}