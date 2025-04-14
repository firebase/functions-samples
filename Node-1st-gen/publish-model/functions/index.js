/**
 * Copyright 2020 Google Inc. All Rights Reserved.
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

const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
admin.initializeApp();

const ml = admin.machineLearning();
const path = require("path");

/**
 * When a .tflite file is uploaded into the GCS bucket, we automatically create
 * a Firebase Model based on it and publish the model.
 * The name of the model is the name of the file.
 *
 */

// [START publishModelTrigger]
exports.createFirebaseTFLiteModel = functions.storage
  .object()
  .onFinalize(async (object) => {
    // [END publishModelTrigger]
    // [START eventAttributes]
    const fileBucket = object.bucket; // The Storage bucket that contains the file.
    const filePath = object.name; // File path in the bucket.
    const contentType = object.contentType; // File content type. E.g. application/octet-stream
    const metageneration = object.metageneration; // Number of times metadata has been generated. New objects have a value of 1.
    // [END eventAttributes]

    // [START stopConditions]
    // Exit if this is triggered on a file that is not a tflite file
    if (!filePath.endsWith(".tflite")) {
      return functions.logger.log(
        `Content type is: ${contentType}. This is not a TFLite file.`,
      );
    }
    // [END stopConditions]

    // Get the file name without the path or extension.
    const modelName = path.basename(filePath, ".tflite");

    // Make sure the file name matches model name requirements (regex).
    const re = /^[A-Za-z\d_-]{1,32}$/;
    if (!re.test(modelName)) {
      const errMsg =
        "Model name must be 1 to 32 characters long, and may only consist of alphanumeric characters, underscores, and hyphens.";
      return functions.logger.log(
        `Not creating model '${modelName}'. ${errMsg}`,
      );
    }

    const gcsUri = `gs://${fileBucket}/${filePath}`;

    const modelOptions = {
      displayName: modelName,
      tfliteModel: { gcsTfliteUri: gcsUri },
    };

    // List models with same name. (Display name is unique - this returns exactly 0 or 1 models)
    const modelsResult = await ml.listModels({
      filter: `display_name = ${modelName}`,
    });

    let model;
    if (modelsResult.models.length > 0) {
      // The model already exists.
      // Check the source to see if it matches
      const existingModel = modelsResult.models[0];
      if (existingModel.tfliteModel.gcsTfliteUri === gcsUri) {
        // It's ok to update this model since it's from the same source file.
        model = await ml.updateModel(existingModel.modelId, modelOptions);
      } else {
        // For safety - don't overwrite (update) Firebase Models that were created a different way.
        return functions.logger.log(
          "Not updating existing model with same name. Existing model was created from a different source location.",
        );
      }
    } else {
      model = await ml.createModel(modelOptions);
    }

    if (model.validationError) {
      // Can't publish models with validation errors
      return functions.logger.log(
        `Validation error: ${model.validationError}. Will not publish the model.`,
      );
    }

    const publishedModel = await ml.publishModel(model.modelId);
    return functions.logger.log(
      `Model ${modelName} published at ${publishedModel.updateTime}.`,
    );
  });
// [END publishModel]
