/**
 * Copyright 2017 Google Inc. All Rights Reserved.
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
"use strict";
const functions = require('firebase-functions');
const admin = require("firebase-admin"); 
const gcs = require('@google-cloud/storage')();
const path = require('path');
const os = require('os');
const fs = require('fs');
const spawn = require('child-process-promise').spawn;

admin.initializeApp(functions.config().firebase);

// Makes a command and return a promise
function promisifyCommand(command) {
  return new Promise((resolve, reject) => {
    command.on('end', resolve).on('error', reject).run();
  });
}

exports.denoiseAudio = functions.storage.object().onFinalize(async (object) => {
  const fileBucket = object.bucket;
  const filePath = object.name;
  const fileName = path.basename(filePath);
  const contentType = object.contentType;
  const normLevel = "-8";

  if (!contentType.startsWith('audio')) {
    console.log("This is not an audio")
    return null;
  }
  if (fileName.startsWith('n_') || fileName.startsWith('d_')) {
    console.log("This file is already processed");
    return null;
  }

  // Static executable of SoX built on Ubuntu 18.04.3 LTS (GNU/Linux 5.0.0-25-generic x86_64)
  const soxPath = [__dirname, 'sox'].join('/');
  const bucket = gcs.bucket(fileBucket);
  const tempFilePath = path.join(os.tmpdir(), fileName);
  const noiseProfPath = path.join(os.tmpdir(), "noise.prof");
  const denoisedTempFileName = "d_" + fileName;
  const denoisedTempFilePath = path.join(os.tmpdir(), denoisedTempFileName);
  const normedTempFileName = "n_" + denoisedTempFileName;
  const normedTempFilePath = path.join(os.tmpdir(), normedTempFileName);
  const normedStorageFilePath = path.join(path.dirname(filePath), normedTempFileName);

  await bucket.file(filePath).download({destination: tempFilePath});
  console.log("Audio uploaded locally to ", tempFilePath);

  await spawn(soxPath, [
    tempFilePath, "-n", "noiseprof", noiseProfPath
  ], {capture : ['stdout', 'stderr']})
  .catch(err => {
    console.log(err)
  })
  console.log("Noise profile created at", noiseProfPath)

  await spawn(soxPath, [
    tempFilePath, denoisedTempFilePath, "noisered", noiseProfPath, "0.1"
  ], {capture : ['stdout', 'stderr']})
  .catch(err => {
    console.log(err)
  })
  console.log("Denoised audio created at", denoisedTempFilePath)

  await spawn(soxPath, [
    `--norm=${normLevel}`, denoisedTempFilePath, normedTempFilePath
  ], {capture : ['stdout', 'stderr']})
  .catch(err => {
    console.log(err)
  });
  console.log('Normed audio created at', normedTempFilePath);

  await bucket.upload(normedTempFilePath, {
    destination: normedStorageFilePath,
    metadata: {
      contentType: "audio/x-wav"
    }
  });
  console.log('Normed audio uploaded to ', normedStorageFilePath);

  // Once the audio has been uploaded delete the local file to free up disk space
  fs.unlinkSync(tempFilePath);
  fs.unlinkSync(normedTempFilePath);

  return console.log('Temporary files removed.', normedTempFilePath)
});
