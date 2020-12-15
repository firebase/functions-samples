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
const admin = require('firebase-admin');
admin.initializeApp();
const mkdirp = require('mkdirp');
const vision = require('@google-cloud/vision');
const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');

const VERY_UNLIKELY = 'VERY_UNLIKELY';
const BLURRED_FOLDER = 'blurred';

/**
 * When an image is uploaded we check if it is flagged as Adult or Violence by the Cloud Vision
 * API and if it is we blur it using ImageMagick.
 */
exports.blurOffensiveImages = functions.storage.object().onFinalize(async (object) => {
  // Ignore things we've already blurred
  if (object.name.startsWith(`${BLURRED_FOLDER}/`)) {
    console.log(`Ignoring upload "${object.name}" because it was already blurred.`);
    return null;
  }
  
  // Check the image content using the Cloud Vision API.
  const visionClient = new vision.ImageAnnotatorClient();
  const data = await visionClient.safeSearchDetection(
    `gs://${object.bucket}/${object.name}`
  );

  const safeSearch = data[0].safeSearchAnnotation;
  console.log('SafeSearch results on image', safeSearch);

  // Tune these detection likelihoods to suit your app.
  // The current settings show the most strict configuration
  // Docs: https://cloud.google.com/vision/docs/reference/rpc/google.cloud.vision.v1#google.cloud.vision.v1.SafeSearchAnnotation
  if (
    safeSearch.adult !== VERY_UNLIKELY ||
    safeSearch.spoof !== VERY_UNLIKELY ||
    safeSearch.medical !== VERY_UNLIKELY ||
    safeSearch.violence !== VERY_UNLIKELY ||
    safeSearch.racy !== VERY_UNLIKELY
  ) {
    console.log('Offensive image found. Blurring.');
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
    destination: `${BLURRED_FOLDER}/${filePath}`,
    metadata: {metadata: metadata}, // Keeping custom metadata.
  });
  console.log('Blurred image uploaded to Storage at', filePath);

  // Clean up the local file
  fs.unlinkSync(tempLocalFile);
  console.log('Deleted local file', filePath);
}
