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

// [START import]
const functions = require('firebase-functions');
const gcs = require('@google-cloud/storage')();
const sharp = require('sharp');
// [END import]

const THUMB_MAX_WIDTH = 200;
const THUMB_MAX_HEIGHT = 200;

// [START generateThumbnail]
/**
 * When an image is uploaded in the Storage bucket We generate a thumbnail automatically using
 * ImageMagick.
 */
// [START generateThumbnailTrigger]
exports.generateThumbnail = functions.storage.object().onChange(event => {
// [END generateThumbnailTrigger]
  // [START eventAttributes]
  const object = event.data; // The Storage object.

  const fileBucket = object.bucket; // The Storage bucket that contains the file.
  const filePath = object.name; // File path in the bucket.
  const contentType = object.contentType; // File content type.
  const resourceState = object.resourceState; // The resourceState is 'exists' or 'not_exists' (for file/folder deletions).
  const metageneration = object.metageneration; // Number of times metadata has been generated. New objects have a value of 1.
  // [END eventAttributes]

  // [START stopConditions]
  // Exit if this is triggered on a file that is not an image.
  if (!contentType.startsWith('image/')) {
    console.log('This is not an image.');
    return;
  }

  // Get the file name.
  const fileName = filePath.split('/').pop();
  // Exit if the image is already a thumbnail.
  if (fileName.startsWith('thumb_')) {
    console.log('Already a Thumbnail.');
    return;
  }

  // Exit if this is a move or deletion event.
  if (resourceState === 'not_exists') {
    console.log('This is a deletion event.');
    return;
  }

  // Exit if file exists but is not new and is only being triggered
  // because of a metadata change.
  if (resourceState === 'exists' && metageneration > 1) {
    console.log('This is a metadata change event.');
    return;
  }
  // [END stopConditions]

  // [START thumbnailGeneration]
  // Download file from bucket.
  const bucket = gcs.bucket(fileBucket);

  const metadata = {
    contentType: contentType
  };
  // We add a 'thumb_' prefix to thumbnails file name. That's where we'll upload the thumbnail
  const thumbFilePath = filePath.replace(/(\/)?([^\/]*)$/, '$1thumb_$2');
  // Create write stream for uploading thumbnail
  const thumbnailUploadStream = bucket.file(thumbFilePath).createWriteStream({metadata});

  // Create Sharp pipeline for resizing the image and use pipe to read from bucket read stream
  const pipeline = sharp();
  pipeline
    .resize(THUMB_MAX_WIDTH, THUMB_MAX_HEIGHT)
    .max()
    .pipe(thumbnailUploadStream);

  bucket.file(filePath).createReadStream().pipe(pipeline);

  const streamAsPromise = new Promise((resolve, reject) =>
    thumbnailUploadStream.on('finish', resolve).on('error', reject));
  return streamAsPromise.then(() => {
    console.log('Thumbnail created successfully');
  });
  // [END thumbnailGeneration]
});
// [END generateThumbnail]
