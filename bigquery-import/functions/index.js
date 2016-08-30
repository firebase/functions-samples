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
'use strict';

const functions = require('firebase-functions');
const Q = require('q');

// Authenticate to gcloud.
// TODO: Make sure you add your Google Project ID, Private key and Email into the env.json file.
const gcloudconfig = {
  projectId: functions.env.get('google.project_id'),
  credentials: require('./service-accounts.json')
};
const gcloud = require('gcloud')(gcloudconfig);
const bigquery = gcloud.bigquery();
// TODO: Change <YOUR-DATASET-NAME> with your BigQuery dataset name.
const dataset = bigquery.dataset('<YOUR-DATASET-NAME>');
// TODO: Change <YOUR-TABLE-NAME> with your BigQuery table name.
const table = dataset.table('<YOUR-TABLE-NAME>');

/**
 * Writes all logs from the Realtime Database into bigquery.
 */
exports.addtobigquery = functions.database().path('/logs/$logid').on('value', event => {
  const result = Q.defer();
  table.insert({
    ID: event.data.key(),
    MESSAGE: event.data.val().message,
    NUMBER: event.data.val().number
  }, (err, insertErr) => {
    if (err) {
      console.log(err);
      result.reject(err);
    } else if (insertErr) {
      console.log(insertErr);
      result.reject(insertErr);
    } else {
      result.resolve();
    }
  });
  return result.promise;
});
