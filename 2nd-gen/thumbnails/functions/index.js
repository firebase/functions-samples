/**
 * Copyright 2022 Google Inc. All Rights Reserved.
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

// [START v2storageImports]
// [START v2storageSDKImport]
const { onFinalize } = require('firebase-functions/v2/storage');
// [END v2storageSDKImport]

// [START v2storageAdditionalImports]
const {initializeApp} = require('firebase-admin/app');
const {getStorage} = require('firebase-admin/storage');
const logger = require('firebase-functions/logger');
const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');

initializeApp()
// [END v2storageAdditionalImports]
// [END v2storageImports]

// [START v2storageGenerateThumbnail]
/**
 * When an image is uploaded in the Storage bucket We generate a thumbnail automatically using
 * ImageMagick.
 */
// [START v2storageGenerateThumbnailTrigger]
exports.generateThumbnail = onFinalize({ cpu: 2 }, async (event) => {
// [END v2storageGenerateThumbnailTrigger]

  // [START v2storageEventAttributes]
  const fileBucket = event.data.bucket; // Storage bucket containing the file.
  const filePath = event.data.name; // File path in the bucket.
  const contentType = event.data.contentType; // File content type.
  // [END v2storageEventAttributes]

  // [START v2storageStopConditions]
  // Exit if this is triggered on a file that is not an image.
  if (!contentType.startsWith('image/')) {
    return logger.log('This is not an image.');
  }
  // Exit if the image is already a thumbnail.
  const fileName = path.basename(filePath);
  if (fileName.startsWith('thumb_')) {
    return logger.log('Already a Thumbnail.');
  }
  // [END v2storageStopConditions]

  // [START v2storageThumbnailGeneration]
  // Download file from bucket.
  const bucket = getStorage().bucket(fileBucket);
  const tempPath = path.join(os.tmpdir(), fileName);
  await bucket.file(filePath).download({destination: tempPath});
  logger.log('Image downloaded locally to', tempPath);

  // Generate a thumbnail using ImageMagick.
  await spawn('convert', [tempPath, '-thumbnail', '200x200>', tempPath]);
  logger.log('Thumbnail created at', tempPath);

  // Prefix 'thumb_' to file name.
  const thumbFileName = `thumb_${fileName}`;
  const thumbFilePath = path.join(path.dirname(filePath), thumbFileName);
  
  // Uploading the thumbnail.
  const metadata = { contentType: contentType };
  await bucket.upload(tempPath, {
    destination: thumbFilePath,
    metadata: metadata,
  });
  
  // Once the thumbnail has been uploaded delete the local file to free up disk space.
  return fs.unlinkSync(tempPath);
  // [END v2storageThumbnailGeneration]
});
// [END v2storageGenerateThumbnail]
