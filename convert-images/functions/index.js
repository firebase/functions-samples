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
const exec = require('child-process-promise').exec;
const LOCAL_TMP_FOLDER = '/tmp/';

// File extension for the created JPEG files.
const JPEG_EXTENSION = 'jpg';

/**
 * When an image is uploaded in the Storage bucket it is converted to JPEG automatically using
 * ImageMagick.
 */
exports.imageToJPG = functions.storage().onChange(event => {
  const filePath = event.data.name;
  const filePathSplit = filePath.split('/');
  const fileName = filePathSplit.pop();
  const fileNameSplit = fileName.split('.');
  const fileExtension = fileNameSplit.pop();
  const baseFileName = fileNameSplit.join('.');
  const fileDir = filePathSplit.join('/') + (filePathSplit.length > 0 ? '/' : '');
  const JPEGFilePath = `${fileDir}${baseFileName}.${JPEG_EXTENSION}`;//
  const tempLocalDir = `${LOCAL_TMP_FOLDER}${fileDir}`;
  const tempLocalFile = `${tempLocalDir}${fileName}`;//
  const tempLocalJPEGFile = `${LOCAL_TMP_FOLDER}${JPEGFilePath}`;//

  // Exit if this is triggered on a file that is not an image.
  if (!event.data.contentType.startsWith('image/')) {
    console.log('This is not an image.');
    return null;
  }

  // Exit if the image is already a JPEG.
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
  return mkdirp(tempLocalDir).then(() => {
    // Download file from bucket.
    const bucket = gcs.bucket(event.data.bucket);
    return bucket.file(filePath).download({
      destination: tempLocalFile
    }).then(() => {
      console.log('The file has been downloaded to', tempLocalFile);
      // Convert the image to JPEG using ImageMagick.
      return exec(`convert "${tempLocalFile}" "${tempLocalJPEGFile}"`).then(() => {
        console.log('JPEG image created at', tempLocalJPEGFile);
        // Uploading the JPEG image.
        return bucket.upload(tempLocalJPEGFile, {
          destination: JPEGFilePath
        }).then(() => {
          console.log('JPEG image uploaded to Storage at', filePath);
        });
      });
    });
  });
});
