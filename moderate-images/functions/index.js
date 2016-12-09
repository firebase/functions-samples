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
const vision = require('@google-cloud/vision')();
const exec = require('child-process-promise').exec;
const LOCAL_TMP_FOLDER = '/tmp/';

/**
 * When an image is uploaded we check if it is flagged as Adult or Violence by the Cloud Vision
 * API and if it is we blur it using ImageMagick.
 */
exports.blurOffensiveImages = functions.storage().onChange(event => {
  const file = gcs.bucket(event.data.bucket).file(event.data.name);

  // Exit if this is a move or deletion event.
  if (event.data.resourceState === 'not_exists') {
    return console.log('This is a deletion event.');
  }

  // Check the image content using the Cloud Vision API.
  return vision.detectSafeSearch(file).then(data => {
    const safeSearch = data[0];
    console.log('SafeSearch results on image', safeSearch);

    if (safeSearch.adult || safeSearch.violence) {
      return blurImage(event.data.name, event.data.bucket, event.data.metadata);
    }
  });
});

/**
 * Blurs the given image located in the given bucket using ImageMagick.
 */
function blurImage(filePath, bucketName, metadata) {
  const filePathSplit = filePath.split('/');
  filePathSplit.pop();
  const fileDir = filePathSplit.join('/');
  const tempLocalDir = `${LOCAL_TMP_FOLDER}${fileDir}`;
  const tempLocalFile = `${LOCAL_TMP_FOLDER}${filePath}`;

  // Create the temp directory where the storage file will be downloaded.
  return mkdirp(tempLocalDir).then(() => {
    // Download file from bucket.
    const bucket = gcs.bucket(bucketName);
    return bucket.file(filePath).download({
      destination: tempLocalFile
    }).then(() => {
      console.log('The file has been downloaded to', tempLocalFile);
      // Blur the image using ImageMagick.
      return exec(`convert ${tempLocalFile} -channel RGBA -blur 0x8 ${tempLocalFile}`).then(() => {
        console.log('Blurred image created at', tempLocalFile);
        // Uploading the Blurred image.
        return bucket.upload(tempLocalFile, {
          destination: filePath,
          metadata: {metadata: metadata} // Keeping custom metadata.
        }).then(() => {
          console.log('Blurred image uploaded to Storage at', filePath);
        });
      });
    });
  });
}
