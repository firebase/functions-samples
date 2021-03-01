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
'use strict';

// Firebase setup
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Node.js core modules
const fs = require('fs');
const mkdirp = fs.promises.mkdir;
const {promisify} = require('util');
const exec = promisify(require('child_process').exec);
const path = require('path');
const os = require('os');

// Vision API
const vision = require('@google-cloud/vision');
// https://cloud.google.com/vision/docs/reference/rpc/google.cloud.vision.v1#google.cloud.vision.v1.SafeSearchAnnotation
const likelihood = {
  UNKNOWN: 'UNKNOWN',
  VERY_UNLIKELY: 'VERY_UNLIKELY',
  UNLIKELY: 'UNLIKELY',
  POSSIBLE: 'POSSIBLE',
  LIKELY: 'LIKELY',
  VERY_LIKELY: 'VERY_LIKELY',
};

const VERY_UNLIKELY = 'VERY_UNLIKELY';
const BLURRED_FOLDER = 'blurred';

/**
 * When an image is uploaded we check if it is flagged as Adult or Violence by the Cloud Vision
 * API and if it is we blur it using ImageMagick.
 */
exports.blurOffensiveImages = functions.storage.object().onFinalize(async (object) => {
  // Ignore things we've already blurred
  if (object.name.startsWith(`${BLURRED_FOLDER}/`)) {
    functions.logger.log(`Ignoring upload "${object.name}" because it was already blurred.`);
    return null;
  }
  
  // Check the image content using the Cloud Vision API.
  const visionClient = new vision.ImageAnnotatorClient();
  const data = await visionClient.safeSearchDetection(
    `gs://${object.bucket}/${object.name}`
  );
  const safeSearch = data[0].safeSearchAnnotation;
  functions.logger.log(`SafeSearch results on image "${object.name}"`, safeSearch);

  // Tune these detection likelihoods to suit your app.
  // The current settings show the most strict configuration
  if (
    safeSearch.adult !== likelihood.VERY_UNLIKELY ||
    safeSearch.spoof !== likelihood.VERY_UNLIKELY ||
    safeSearch.medical !== likelihood.VERY_UNLIKELY ||
    safeSearch.violence !== likelihood.VERY_UNLIKELY ||
    safeSearch.racy !== likelihood.VERY_UNLIKELY
  ) {
    functions.logger.log('Offensive image found. Blurring.');
    return blurImage(object.name, object.bucket, object.metadata);
  }

  return null;
});

/**
 * Blurs the given image located in the given bucket using ImageMagick.
 */
async function blurImage(filePath, bucketName, metadata) {
  const tempLocalFile = path.join(os.tmpdir(), filePath);
  const tempLocalDir = path.dirname(tempLocalFile);
  const bucket = admin.storage().bucket(bucketName);

  // Create the temp directory where the storage file will be downloaded.
  await mkdirp(tempLocalDir, { recursive: true });
  functions.logger.log('Temporary directory has been created', tempLocalDir);

  // Download file from bucket.
  await bucket.file(filePath).download({ destination: tempLocalFile });
  functions.logger.log('The file has been downloaded to', tempLocalFile);

  // Blur the image using ImageMagick.
  await exec(`convert "${tempLocalFile}" -channel RGBA -blur 0x8 "${tempLocalFile}"`);
  functions.logger.log('Blurred image created at', tempLocalFile);

  // Uploading the Blurred image.
  await bucket.upload(tempLocalFile, {
    destination: `${BLURRED_FOLDER}/${filePath}`,
    metadata: {metadata: metadata}, // Keeping custom metadata.
  });
  functions.logger.log('Blurred image uploaded to Storage at', filePath);

  // Clean up the local file
  fs.unlinkSync(tempLocalFile);
  functions.logger.log('Deleted local file', filePath);
}
