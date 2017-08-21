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
const args = process.argv.slice(2);
const path = args[1];

const assert = require('assert');
const Controller = require('../controller');
let model;
if (path) {
  const admin = require('firebase-admin');
  const serviceAccount = require(path);
  const Model = require('../model').Model;
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
  });
  model = new Model(admin.database());
} else {
  const Model = require('../model').TestModel;
  model = new Model({});
}
const controller = new Controller(model);

describe('onLike', () => {
  it('should assign tags from liked to liker and gen recs', (done) => {
    Promise.all([
      controller.indexPostByUser('U1', '1', 'this is post 1'),
      controller.indexPostByUser('U2', '1', 'this is post 1'),
      controller.indexPostByUser('U3', '1', 'this is post 1'),
      controller.indexTagsByObject('1', ['sports']),
    ])
    .then((_) => {
      return Promise.all([
        controller.onLike('U1', '1'),
        controller.onLike('U2', '1'),
        controller.onLike('U3', '1'),
      ]);
    })
    .then((_) => {
      return Promise.all([
        controller.getRecsByUser('U1'),
        controller.getRecsByUser('U2'),
        controller.getRecsByUser('U3'),
      ]);
    })
    .then((recs) => {
      assert.deepEqual(Object.keys(recs[0]), ['U2', 'U3']);
      assert.deepEqual(Object.keys(recs[1]), ['U1', 'U3']);
      assert.deepEqual(Object.keys(recs[2]), ['U1', 'U2']);
      done();
    })
    .catch((e) => {
      /* eslint no-console: ["error", { allow: ["error"] }] */
      console.error(e);
    });
  });
});

