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
const fs = require('fs');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const gcs = require('@google-cloud/storage')();
const exec = require('child-process-promise').exec;
const LOCAL_TMP_FOLDER = '/tmp/';

/**
 * When an image is uploaded in the Storage bucket the information and metadata of the image (the
 * output of ImageMagick's `identify -verbose`) is saved in the Realtime Database.
 */
exports.metadata = functions.storage.object().onChange(event => {
  const object = event.data;
  const filePath = object.name;
  const fileName = filePath.split('/').pop();
  const fileDir = filePathSplit.join('/') + (filePathSplit.length > 0 ? '/' : '');

  const tempLocalDir = `${LOCAL_TMP_FOLDER}${fileDir}`;
  const tempLocalFile = `${LOCAL_TMP_FOLDER}${fileName}`;

  // Exit if this is triggered on a file that is not an image.
  if (!object.contentType.startsWith('image/')) {
    console.log('This is not an image.');
    return;
  }

  // Exit if this is a move or deletion event.
  if (object.resourceState === 'not_exists') {
    console.log('This is a deletion event.');
    return;
  }

  const bucket = gcs.bucket(object.bucket);
  //create the temp directory where storage file will be downloaded
  return mkdirp(tempLocalDir).then(()=>{
    // Download file from bucket.
    return bucket.file(filePath).download({
      destination: tempLocalFile
    });
  }).then(() => {
    // Get Metadata from image.
    return exec(`identify -verbose "${tempLocalFile}"`).then(result => {
      const metadata = imageMagickOutputToObject(result.stdout);
      // Save metadata to realtime datastore.
      return admin.database().ref(makeKeyFirebaseCompatible(filePath)).set(metadata).then(() => {
        console.log('Wrote to:', filePath, 'data:', metadata);
      });
    });
  }).then(()=>{
    //cleanup temp directory after metadata is extracted
    //Remove the file from temp directory
    return fs.unlink(tempLocalFile,()=>{
      console.log("cleanup successful!");
    });
  });
});

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
