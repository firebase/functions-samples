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
const im = require('imagemagick');
const mkdirp = require('mkdirp');
const gcs = require('@google-cloud/storage')();
const Q = require('q');

// File extension for the created JPEG files.
const JPEG_EXTENSION = 'jpg';

/**
 * When an image is uploaded in the Storage bucket it is converted to JPEG automatically using
 * ImageMagick.
 */
// TODO(DEVELOPER): Replace the placeholder below with the name of the Firebase Functions bucket.
exports.imagetojpg = functions.cloud.storage(FIREBASE_STORAGE_BUCKET_NAME).onChange(event => {
  console.log(event);
  const result = Q.defer();

  const filePath = event.data.name;
  const filePathSplit = filePath.split('/');
  const fileName = filePathSplit.pop();
  const fileNameSplit = fileName.split('.');
  const fileExtension = fileNameSplit.pop();
  const baseFileName = fileNameSplit.join('.');
  const fileDir = filePathSplit.join('/') + (filePathSplit.length > 0 ? '/' : '');
  const JPEGFilePath = `${fileDir}${baseFileName}.${JPEG_EXTENSION}`;
  const tempLocalDir = `/tmp/${fileDir}`;
  const tempLocalFile = `${tempLocalDir}${fileName}`;
  const tempLocalJPEGFile = `/tmp/${JPEGFilePath}`;

  // Exit if this is triggered on a file that is not an image.
  if (!event.data.contentType.startsWith('image/')) {
    console.log('This is not an image.');
    return null;
  }

  // Exit if this is triggered on a file that is not an image.
  if (event.data.contentType.startsWith('image/jpeg')) {
    console.log('Already a JPEG.');
    return null;
  }

  // Exit if this is a move or deletion event.
  if (event.data.resourceState === 'not_exists') {
    console.log('This is a deletion event.');
    return null;
  }

  // Create the temp directory where the storage file will be downloaded.
  mkdirp(tempLocalDir, err => {
    if (err) return result.reject(err);

    // Download file from bucket.
    const bucket = gcs.bucket(event.data.bucket);
    bucket.file(filePath).download({
      destination: tempLocalFile
    }, err => {
      if (err) return result.reject(err);

      console.log('The file has been downloaded to', tempLocalFile);
      // Convert the image to JPEG using ImageMagick.
      im.convert([
        tempLocalFile,
        tempLocalJPEGFile
      ], err => {
        if (err) return result.reject(err);

        console.log('Created JPEG for', filePath);
        // Uploading the JPEG.
        bucket.upload(tempLocalJPEGFile, {
          destination: JPEGFilePath
        }, err => {
          if (err) return result.reject(err);

          console.log('JPEG uploaded to Storage at', JPEGFilePath);
          result.resolve();
        });
      });
    });
  });
  return result.promise;
});
