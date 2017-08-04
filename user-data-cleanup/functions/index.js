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

const admin = require('firebase-admin');
const functions = require('firebase-functions');
admin.initializeApp(functions.config().firebase);

const wipeout = require('./wipeout');

const WIPEOUT_CONFIG = {
    'credential': admin.credential.applicationDefault(),
    'db': admin.database(),
    'serverValue': admin.database.ServerValue,
    'users': functions.auth.user(),
    'https': functions.https,
    'DB_URL': functions.config().firebase.databaseURL,
  };

wipeout.initialize(WIPEOUT_CONFIG);

exports.cleanupUserData = wipeout.cleanupUserData();

exports.showWipeoutConfig = wipeout.showWipeoutConfig();

