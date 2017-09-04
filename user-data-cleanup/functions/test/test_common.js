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
// potential setups which cloud be shared by multiple test files.
const admin = require('firebase-admin');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const functions = require('firebase-functions');
const sinon = require('sinon');

/** test_common has require statements for all the modules. */
exports.admin = admin;
/** test_common has require statements for all the modules. */
exports.chai = chai;
/** test_common has require statements for all the modules. */
exports.chaiAsPromised = chaiAsPromised;
/** test_common has require statements for all the modules. */
exports.expect = chai.expect;
/** test_common has require statements for all the modules. */
exports.functions = functions;
/** test_common has require statements for all the modules. */
exports.sinon = sinon;
