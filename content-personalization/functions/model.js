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

const get = require('lodash.get');
const set = require('lodash.set');

/**
 * A database abstraction for quick, transparent testing
 * using in-memory storage.
 */
exports.TestModel = class TestModel {
  constructor(storage) {
    this.storage = storage;
  }
  get(key) {
    key = key.replace(/\//g, '.');
    const values = get(this.storage, key);
    return Promise.resolve(values);
  }
  set(key, value) {
    key = key.replace(/\//g, '.');
    set(this.storage, key, value);
    return Promise.resolve();
  }
};

/**
 * A database abstraction over the Firebase database.
 */
exports.Model = class Model {
  constructor(storage) {
    this.storage = storage;
  }
  get(key) {
    return this.storage.ref(key).once('value').then((snap) => snap.val());
  }
  set(key, value) {
    return this.storage.ref(key).set(value);
  }
};

