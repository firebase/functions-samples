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
 * See the License for t`he specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const functions = require('firebase-functions');
const mkdirp = require('mkdirp-promise');
const gcs = require('@google-cloud/storage')();
const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');

// File extension for the created JPEG files.
const JPEG_EXTENSION = '.jpg';

/**
 * When an image is uploaded in the Storage bucket it is converted to JPEG automatically using
 * ImageMagick.
 */
exports.imageToJPG = functions.storage.object().onFinalize((object) => {
  const filePath = object.name;
  const baseFileName = path.basename(filePath, path.extname(filePath));
  const fileDir = path.dirname(filePath);
  const JPEGFilePath = path.normalize(path.format({dir: fileDir, name: baseFileName, ext: JPEG_EXTENSION}));
  const tempLocalFile = path.join(os.tmpdir(), filePath);
  const tempLocalDir = path.dirname(tempLocalFile);
  const tempLocalJPEGFile = path.join(os.tmpdir(), JPEGFilePath);

  // Exit if this is triggered on a file that is not an image.
  if (!object.contentType.startsWith('image/')) {
    console.log('This is not an image.');
    return null;
  }

  // Exit if the image is already a JPEG.
  if (object.contentType.startsWith('image/jpeg')) {
    console.log('Already a JPEG.');
    return null;
  }

  // Exit if this is a move or deletion event.
  if (object.resourceState === 'not_exists') {
    console.log('This is a deletion event.');
    return null;
  }

  const bucket = gcs.bucket(object.bucket);
  // Create the temp directory where the storage file will be downloaded.
  return mkdirp(tempLocalDir).then(() => {
    // Download file from bucket.
    return bucket.file(filePath).download({destination: tempLocalFile});
  }).then(() => {
    console.log('The file has been downloaded to', tempLocalFile);
    // Convert the image to JPEG using ImageMagick.
    return spawn('convert', [tempLocalFile, tempLocalJPEGFile]);
  }).then(() => {
    console.log('JPEG image created at', tempLocalJPEGFile);
    // Uploading the JPEG image.
    return bucket.upload(tempLocalJPEGFile, {destination: JPEGFilePath});
  }).then(() => {
    console.log('JPEG image uploaded to Storage at', JPEGFilePath);
    // Once the image has been converted delete the local files to free up disk space.
    fs.unlinkSync(tempLocalJPEGFile);
    fs.unlinkSync(tempLocalFile);
    return;
  });
});
