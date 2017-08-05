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
const sinonStubPromise = require('sinon-stub-promise');

exports.admin = admin;
exports.chai = chai;
exports.chaiAsPromised = chaiAsPromised;
exports.expect = chai.expect;
exports.functions = functions;
exports.sinon = sinon;
exports.sinonStubPromise = sinonStubPromise;