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

const functions = require('firebase-functions');
const { Storage } = require('@google-cloud/storage');
const gcs = new Storage();
const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');
var gs = require('gs');


//This function triggers whenever any pdf is uploaded to the firebase storage
//and attempts to generate

exports.makePreviews = functions.storage.object().onFinalize(async (object, event) => {

  //Checking for pdf files
  if (!object.name.endsWith('.pdf')) return false;

  const filePath = object.name;

  //slicing name and path
  const splitFileName = object.name.split(".");
  const fileID = splitFileName[0].split("/")[1];

  console.log("File ID -", fileID);

  //creating temporary path strings for gcp file system
  const fileName = path.basename(filePath);
  const tempFilePath = path.join(os.tmpdir(), fileName);

  const newName1 = path.basename(filePath, '.pdf') + '01.jpeg';
  const tempNewPath1 = path.join(os.tmpdir(), newName1);

  const newName2 = path.basename(filePath, '.pdf') + '02.jpeg';
  const tempNewPath2 = path.join(os.tmpdir(), newName2);


  //downloading file from firebase storage
  const bucket = gcs.bucket(object.bucket);

  return bucket.file(filePath).download({
    destination: tempFilePath
  }).then(async () => {
    console.log('PDF downloaded locally to', tempFilePath);

    //generating two preview JPEGS
    await new Promise((resolve, reject) => {
      gs()
        .batch()
        .option('-dFirstPage=1')
        .option('-dLastPage=1')
        .nopause()
        .res(90)
        .executablePath('gs')
        .device('jpeg')
        .output(tempNewPath1)
        .input(tempFilePath)
        .exec((err, stdout, stderr) => {
          if (!err) {
            console.log('gs executed w/o error');
            console.log('stdout', stdout);
            console.log('stderr', stderr);
            resolve();
          } else {
            console.log('gs error:', err);
            reject(err);
          }
        });
    });

    return new Promise((resolve, reject) => {
      gs()
        .batch()
        .option('-dFirstPage=2')
        .option('-dLastPage=2')
        .nopause()
        .res(90)
        .executablePath('gs')
        .device('jpeg')
        .output(tempNewPath2)
        .input(tempFilePath)
        .exec((err, stdout, stderr) => {
          if (!err) {
            console.log('gs executed w/o error');
            console.log('stdout', stdout);
            console.log('stderr', stderr);
            resolve();
          } else {
            console.log('gs error:', err);
            reject(err);
          }
        });
    });

  }).then(async () => {
    console.log('PNG created at', tempNewPath1 + 'and' + tempNewPath2);

    //uploading the files back to firebase storage
    await bucket.upload(tempNewPath1, {
      destination: '/files/' + fileID + '/' + fileID + '-01.jpeg'
    });

    return bucket.upload(tempNewPath2, {
      destination: '/files/' + fileID + '/' + fileID + '-02.jpeg'
    });


    
  }).then(() => {
    //once the files have been uploaded delete the local temporary 
    //files to free up disk space.
    fs.unlinkSync(tempNewPath1);
    fs.unlinkSync(tempNewPath2);
    return fs.unlinkSync(tempFilePath);
  }).catch((err) => {
    console.log('exception:', err);
    return err;
  });

});