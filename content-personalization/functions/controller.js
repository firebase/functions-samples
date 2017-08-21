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

const flatten = require('lodash.flatten')

module.exports = class Controller {
  constructor(model) {
    this.model = model;
  }
  onLike(user, object) {
    return this.getTagsByObject(object).then((tags) => {
      const that = this;
      return Promise.all([
        that.indexTagsByObject(user, tags),
        that.indexObjectByTags(user, tags),
        that.getObjectsByTags(tags),
      ]).then((results) => {
        const tagsByObject = this.invertObjectsByTag(results[2])
        return this.indexRecsByUser(tagsByObject, user);
      });
    });
  }
  getTagsByObject(object) {
    const key = `tags_by_object/${object}`;
    return this.model.get(key)
      .then((values) => Object.keys(values));
  }
  indexObjectByTags(object, tags) {
    return Promise.all(tags.map((tag) => {
      return this.indexObjectByTag(object, tag);
    }));
  }
  indexObjectByTag(object, tag) {
    const key = `objects_by_tag/${tag}/${object}`;
    const value = true;
    return this.model.set(key, value);
  }
  indexTagsByObject(object, tags) {
    const ops = tags.map((tag) => {
      const key = `tags_by_object/${object}/${tag}`;
      const value = true;
      return this.model.set(key, value);
    });
    return Promise.all(ops)
  }
  getObjectsByTags(tags) {
    const ops = tags.map(this.getObjectsByTag.bind(this))
    return Promise.all(ops)
      .then((results) => Object.assign({}, ...flatten(results)))
  }
  getObjectsByTag(tag) {
    const key = `objects_by_tag/${tag}`;
    return this.model.get(key)
      .then((objects) => {
        const objectsByTag = {}
        objectsByTag[tag] = Object.keys(objects)
        return objectsByTag
      })
  }
  invertObjectsByTag(objectsByTag){
    return Object.keys(objectsByTag).reduce((tagsByObject, tag) => {
      objectsByTag[tag].forEach((object) => {
        const tags = tagsByObject[object] || []
        tags.push(tag)
        tagsByObject[object] = tags
      })
      return tagsByObject
    }, {})
  }
  indexRecsByUser(tagsByObject, user) {
    const ops = Object.keys(tagsByObject)
      .filter((object) => object != user)
      .reduce((ops, object) => {
        tagsByObject[object].forEach((tag) => {
          let key = `recs/${user}/${object}/tag/${tag}`;
          let value = true
          ops.push(this.model.set(key, value))
        })
        return ops
      }, []);
    return Promise.all(ops)
  }
  indexPostByUser(userId, postId, text) {
    const key = `posts/${userId}/${postId}`;
    const value = text;
    return this.model.set(key, value);
  }
  getRecsByUser(user) {
    const key = `recs/${user}`;
    return this.model.get(key)
  }
};

