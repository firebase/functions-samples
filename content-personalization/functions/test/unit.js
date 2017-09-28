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
const assert = require('assert');
const Controller = require('../controller');
const Model = require('../model').TestModel;

describe('getTagsByObject', () => {
  it('should return array of tags for given object', (done) => {
    const storage = {
      tags_by_object: {
        1: {
          sports: true,
        },
      },
    };
    const controller = new Controller(new Model(storage));
    controller.getTagsByObject('1').then((actual) => {
      const expected = ['sports'];
      assert.deepEqual(actual, expected);
      done();
    });
  });
});

describe('indexObjectByTag', () => {
  it('should add object to storage keyed by tag', (done) => {
    const storage = {};
    const controller = new Controller(new Model(storage));
    controller.indexObjectByTag('1', 'sports').then(() => {
      const expected = {
        objects_by_tag: {
          sports: {
            1: true,
          },
        },
      };
      assert.deepEqual(storage, expected);
      done();
    });
  });
});

describe('indexObjectByTags', () => {
  it('should add object to storage keyed by tags', (done) => {
    const storage = {};
    const controller = new Controller(new Model(storage));
    controller.indexObjectByTags('1', ['news', 'sports']).then(() => {
      const expected = {
        objects_by_tag: {
          sports: {
            1: true,
          },
          news: {
            1: true,
          },
        },
      };
      assert.deepEqual(storage, expected);
      done();
    });
  });
});

describe('indexTagsByObject', () => {
  it('should add tags to storage keyed by given object', (done) => {
    const storage = {};
    const controller = new Controller(new Model(storage));
    controller.indexTagsByObject('1', ['news', 'sports']).then(() => {
      const expected = {
        tags_by_object: {
          1: {
            sports: true,
            news: true,
          },
        },
      };
      assert.deepEqual(storage, expected);
      done();
    });
  });
});

describe('getObjectsByTag', () => {
  it('should return array of objects with given tag', (done) => {
    const storage = {
      objects_by_tag: {
        sports: {
          1: true,
        },
      },
    };
    const controller = new Controller(new Model(storage));
    controller.getObjectsByTag('sports').then((actual) => {
      const expected = {
        sports: ['1']
      }
      assert.deepEqual(actual, expected);
      done();
    });
  });
});

describe('getObjectsByTags', () => {
  it('should return map of given tag to objects with that tag', (done) => {
    const storage = {
      objects_by_tag: {
        sports: {
          1: true,
        },
        news: {
          2: true,
        },
      },
    };
    const controller = new Controller(new Model(storage));
    controller.getObjectsByTags(['sports', 'news']).then((actual) => {
      const expected = {
        sports: ['1'],
        news: ['2']
      }
      assert.deepEqual(actual, expected);
      done();
    });
  });
});

describe('invertObjectsByTag', () => {
  it('should transform map of tags:[object] to object:[tags]', () => {
    const controller = new Controller(new Model({}));
    const objectsByTag = {
      news: ['1', '2'],
      sports: ['1']
    }
    const actual = controller.invertObjectsByTag(objectsByTag)
    const expected = {
      1: ['news', 'sports'],
      2: ['news'],
    }
    assert.deepEqual(actual, expected);
  });
});

describe('indexRecsByUser', () => {
  it('should add rec to storage keyed by user', (done) => {
    const storage = {
    };
    const controller = new Controller(new Model(storage));
    const tagsByObject = {
      2: ['sports', 'news']
    }
    controller.indexRecsByUser(tagsByObject, '1').then(() => {
      const expected = {
        recs: {
          1: {
            2: {
              tag: {
                sports: true,
                news: true
              },
            }
          }
        }
      };
      assert.deepEqual(storage, expected);
      done();
    });
  });
});
