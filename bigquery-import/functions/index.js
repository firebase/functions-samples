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

// gcloud config.
const gcloudconfig = {
  projectId: process.env.GCLOUD_PROJECT
};
const gcloud = require('gcloud')(gcloudconfig);
const bigquery = gcloud.bigquery();

/**
 * Writes all logs from the Realtime Database into bigquery.
 */
exports.addtobigquery = functions.database().path('/logs/$logid').onWrite(event => {
  // TODO: Make sure you set the `bigquery.datasetName` Google Cloud environment variable.
  const dataset = bigquery.dataset(functions.env.bigquery.datasetname);
  // TODO: Make sure you set the `bigquery.tableName` Google Cloud environment variable.
  const table = dataset.table(functions.env.bigquery.tablename);

  const result = Q.defer();
  table.insert({
    ID: event.data.key,
    MESSAGE: event.data.val().message,
    NUMBER: event.data.val().number
  }, (err, insertErr) => {
    if (err || insertErr) {
      console.error(err || insertErr);
      result.reject(err || insertErr);
    } else {
      result.resolve();
    }
  });
  return result.promise;
});
