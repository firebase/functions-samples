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
'use strict';

const functions = require('firebase-functions');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const os = require('os');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpeg_static = require('ffmpeg-static');

const gcs = new Storage();

// Makes an ffmpeg command return a promise.
function promisifyCommand(command) {
  return new Promise((resolve, reject) => {
    command.on('end', resolve).on('error', reject).run();
  });
}

/**
 * When an audio is uploaded in the Storage bucket We generate a mono channel audio automatically using
 * node-fluent-ffmpeg.
 */
exports.generateMonoAudio = functions.storage.object().onFinalize(async (object) => {
  const fileBucket = object.bucket; // The Storage bucket that contains the file.
  const filePath = object.name; // File path in the bucket.
  const contentType = object.contentType; // File content type.

  // Exit if this is triggered on a file that is not an audio.
  if (!contentType.startsWith('audio/')) {
    functions.logger.log('This is not an audio.');
    return null;
  }

  // Get the file name.
  const fileName = path.basename(filePath);
  // Exit if the audio is already converted.
  if (fileName.endsWith('_output.flac')) {
    functions.logger.log('Already a converted audio.');
    return null;
  }

  // Download file from bucket.
  const bucket = gcs.bucket(fileBucket);
  const tempFilePath = path.join(os.tmpdir(), fileName);
  // We add a '_output.flac' suffix to target audio file name. That's where we'll upload the converted audio.
  const targetTempFileName = fileName.replace(/\.[^/.]+$/, '') + '_output.flac';
  const targetTempFilePath = path.join(os.tmpdir(), targetTempFileName);
  const targetStorageFilePath = path.join(path.dirname(filePath), targetTempFileName);

  await bucket.file(filePath).download({destination: tempFilePath});
  functions.logger.log('Audio downloaded locally to', tempFilePath);
  // Convert the audio to mono channel using FFMPEG.

  let command = ffmpeg(tempFilePath)
      .setFfmpegPath(ffmpeg_static.path)
      .audioChannels(1)
      .audioFrequency(16000)
      .format('flac')
      .output(targetTempFilePath);

  await promisifyCommand(command);
  functions.logger.log('Output audio created at', targetTempFilePath);
  // Uploading the audio.
  await bucket.upload(targetTempFilePath, {destination: targetStorageFilePath});
  functions.logger.log('Output audio uploaded to', targetStorageFilePath);

  // Once the audio has been uploaded delete the local file to free up disk space.
  fs.unlinkSync(tempFilePath);
  fs.unlinkSync(targetTempFilePath);

  return functions.logger.log('Temporary files removed.', targetTempFilePath);
});
