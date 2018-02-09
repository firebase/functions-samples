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

const functions = require('firebase-functions');
const app = require('express')();
const Canvas = require('canvas-prebuilt');
const _ = require('lodash');

const clock = require('./clock');
const spark = require('./sparkline');
const ray = require('./ray');

app.get('/api/ray', (req, res) => {
  const tracers = JSON.parse(req.query.tracers);
  if (!_.isArray(tracers) ||
    !_.every(tracers, (depth) => typeof depth === 'number')) {
    //invalid format
    res.status(422);
    res.end();
  }
  const canvas = new Canvas(243 * tracers.length, 243);
  const ctx = canvas.getContext('2d');
  for (var i=0; i<tracers.length; i++) {
    ray(Math.round(27/tracers[i]), 81, ctx, { x: 243, y: 0 });
  }
  res.set('Cache-Control', 'public, max-age=60, s-maxage=31536000');
  res.writeHead(200, { 'Content-Type': 'image/png' })
  canvas.pngStream().pipe(res);
});

app.get('/api/clock', (req, res) => {
  const colorOpts = req.query;
  const canvas = new Canvas(320, 320)
  const ctx = canvas.getContext('2d')
  clock(ctx, colorOpts);
  res.set('Cache-Control', 'public, max-age=60, s-maxage=31536000');
  res.writeHead(200, { 'Content-Type': 'image/png' })
  canvas.pngStream().pipe(res);
});

app.get('/api/spark', (req, res) => {
  const dataSeries = JSON.parse(req.query.series);
  const colorOpts = req.query.colorOpts || {};
  if (!_.isArray(dataSeries) || !_.every(dataSeries, (num) => typeof num === 'number')) {
    //invalid format
    res.status(422);
    res.end();
  }
  const canvas = new Canvas(320, 100);
  var ctx = canvas.getContext('2d');
  spark(ctx, dataSeries, colorOpts);
  res.set('Cache-Control', 'public, max-age=60, s-maxage=31536000');
  res.writeHead(200, { 'Content-Type': 'image/png' })
  canvas.pngStream().pipe(res);
});

exports.app = functions.https.onRequest(app);
