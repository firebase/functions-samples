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
const mkdirp = require('mkdirp-promise');
const vision = require('@google-cloud/vision');
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

  const bucketName = object.bucket;
    const fileName = object.name;
    console.log(bucketName, fileName);

    const client = new vision.ImageAnnotatorClient();

    // Check the image content using the Cloud Vision API.
    const [result] = await client.safeSearchDetection(
      `gs://${bucketName}/${fileName}`
    );
    const detections = result.safeSearchAnnotation;
    console.log(detections);

    if (
      detections.adult === "POSSIBLE" ||
      detections.adult === "LIKELY" ||
      detections.adult === "VERY_LIKELY" ||
      detections.violence === "POSSIBLE" ||
      detections.violence === "LIKELY" ||
      detections.violence === "VERY_LIKELY" ||
      detections.medical === "POSSIBLE" ||
      detections.medical === "LIKELY" ||
      detections.medical === "VERY_LIKELY"
//       DO NOT USE 'RACY' HERE AS BLURRED IMAGES WILL ALWAYS DETECT AS 'RACY' CAUSING AN INFINITE LOOP
    ) {
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
    destination: filePath,
    metadata: {metadata: metadata}, // Keeping custom metadata.
  });
  console.log('Blurred image uploaded to Storage at', filePath);
  fs.unlinkSync(tempLocalFile);
  console.log('Deleted local file', filePath);
}
