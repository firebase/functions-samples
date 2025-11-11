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

const functions = require('firebase-functions/v1');
const {defineString} = require('firebase-functions/params');
const { BigQuery } = require('@google-cloud/bigquery');

const bigquery = new BigQuery();

const BIGQUERY_DATASETNAME = defineString('BIGQUERY_DATASETNAME');
const BIGQUERY_TABLENAME = defineString('BIGQUERY_TABLENAME');

/**
 * Writes all logs from the Realtime Database into bigquery.
 */
exports.addtobigquery = functions.database.ref('/logs/{logid}').onCreate((snapshot) => {
  // TODO: Make sure you set the `BIGQUERY_DATASETNAME` environment variable.
  const dataset = bigquery.dataset(BIGQUERY_DATASETNAME.value());
  // TODO: Make sure you set the `BIGQUERY_TABLENAME` environment variable.
  const table = dataset.table(BIGQUERY_TABLENAME.value());

  return table.insert({
    ID: snapshot.key,
    MESSAGE: snapshot.val().message,
    NUMBER: snapshot.val().number,
  });
});
