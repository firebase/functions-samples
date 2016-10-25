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

const im = require('imagemagick');
const Q = require('q');
const functions = require('firebase-functions');
const mkdirp = require('mkdirp-then');
const gcs = require('@google-cloud/storage')();

/**
 * When an image is uploaded in the Storage bucket the information and metadata of the image (the
 * output of ImageMagick's `identify -verbose`) is saved in the Realtime Database.
 */
// TODO(DEVELOPER): Replace the placeholder below with the name of the Firebase Functions bucket.
exports.metadata = functions.cloud.storage(FIREBASE_STORAGE_BUCKET_NAME).onChange(event => {
  console.log(event);

  const filePath = event.data.name;
  const filePathSplit = filePath.split('/');
  const fileName = filePathSplit.pop();
  const fileDir = filePathSplit.join('/') + (filePathSplit.length > 0 ? '/' : '');
  const tempLocalDir = `/tmp/${fileDir}`;
  const tempLocalFile = `${tempLocalDir}${fileName}`;

  // Exit if this is triggered on a file that is not an image.
  if (!event.data.contentType.startsWith('image/')) {
    console.log('This is not an image.');
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
    return promisedDownloadFile(event.data.bucket, filePath, tempLocalFile).then(() => {
      // Get Metadata from image.
      return promisedImageMagickMetadata(tempLocalFile).then(metadata => {
        // Save metadata to realtime datastore.
        return functions.app.database().ref(makeKeyFirebaseCompatible(filePath)).set(metadata).then(() => {
          console.log('Wrote to:', fileDir, 'data:', metadata);
        });
      });
    });
  });
});

/**
 * Returns a promise that resolves when the given file has been downloaded from the bucket.
 */
function promisedDownloadFile(bucketName, filePath, tempLocalFile) {
  const result = Q.defer();
  const bucket = gcs.bucket(bucketName);
  bucket.file(filePath).download({
    destination: tempLocalFile
  }, err => {
    if (err) {
      result.reject(err);
    } else {
      console.log('The file has been downloaded to', tempLocalFile);
      result.resolve();
    }
  });
  return result.promise;
}

/**
 * Returns a promise that resolves with the metadata extracted from the given file.
 */
function promisedImageMagickMetadata(localFile) {
  const result = Q.defer();

  im.identify(['-verbose', localFile], (err, output) => {
    if (err) {
      console.error('Error', err);
      result.reject(err);
    } else {
      result.resolve(imageMagickOutputToObject(output));
    }
  });
  return result.promise;
}

/**
 * Convert the output of ImageMagick's `identify -verbose` command to a JavaScript Object.
 */
function imageMagickOutputToObject(output) {
  let previousLineIndent = 0;
  const lines = output.match(/[^\r\n]+/g);
  lines.shift(); // Remove First line
  lines.forEach((line, index) => {
    const currentIdent = line.search(/\S/);
    line = line.trim();
    if (line.endsWith(':')) {
      lines[index] = makeKeyFirebaseCompatible(`"${line.replace(':', '":{')}`);
    } else {
      const split = line.replace('"', '\\"').split(': ');
      split[0] = makeKeyFirebaseCompatible(split[0]);
      lines[index] = `"${split.join('":"')}",`;
    }
    if (currentIdent < previousLineIndent) {
      lines[index - 1] = lines[index - 1].substring(0, lines[index - 1].length - 1);
      lines[index] = new Array(1 + (previousLineIndent - currentIdent) / 2).join('}') + ',' + lines[index];
    }
    previousLineIndent = currentIdent;
  });
  output = lines.join('');
  output = '{' + output.substring(0, output.length - 1) + '}'; // remove trailing comma.
  output = JSON.parse(output);
  console.log('Metadata extracted from image', output);
  return output;
}

/**
 * Makes sure the given string does not contain characters that can't be used as Firebase
 * Realtime Database keys such as '.' and replaces them by '*'.
 */
function makeKeyFirebaseCompatible(key) {
  return key.replace(/\./g, '*');
}
