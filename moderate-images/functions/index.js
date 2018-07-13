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
const vision = require('@google-cloud/vision')();
const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');

/**
 * When an image is uploaded we check if it is flagged as Adult or Violence by the Cloud Vision
 * API and if it is we blur it using ImageMagick.
 */
exports.blurOffensiveImages = functions.storage.object().onFinalize(async (object) => {
  const file = admin.storage().bucket(object.bucket).file(object.name);

  // Check the image content using the Cloud Vision API.
  const data = await vision.detectSafeSearch(file);
  const safeSearch = data[0];
  console.log('SafeSearch results on image', safeSearch);

  if (safeSearch.adult || safeSearch.violence) {
    return blurImage(object.name, object.bucket, object.metadata);
  }
});

/**
 * Blurs the given image located in the given bucket using ImageMagick.
 */
async function blurImage(filePath, bucketName, metadata) {
  const tempLocalFile = path.join(os.tmpdir(), filePath);
  const tempLocalDir = path.dirname(tempLocalFile);
  const bucket = admin.storage().bucket(bucketName);

  // Create the temp directory where the storage file will be downloaded.
  await mkdirp(tempLocalDir);
  console.log('Temporary directory has been created', tempLocalDir);
  // Download file from bucket.
  await bucket.file(filePath).download({destination: tempLocalFile});
  console.log('The file has been downloaded to', tempLocalFile);
  // Blur the image using ImageMagick.
  await spawn('convert', [tempLocalFile, '-channel', 'RGBA', '-blur', '0x8', tempLocalFile]);
  console.log('Blurred image created at', tempLocalFile);
  // Uploading the Blurred image.
  await bucket.upload(tempLocalFile, {
    destination: filePath,
    metadata: {metadata: metadata}, // Keeping custom metadata.
  });
  console.log('Blurred image uploaded to Storage at', filePath);
  fs.unlinkSync(tempLocalFile);
  console.log('Deleted local file', filePath);
}
