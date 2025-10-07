# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import os
import firebase_admin
import vertexai
from firebase_admin import remoteconfig
from firebase_functions import https_fn, options
from vertexai.generative_models import (
    GenerativeModel,
    HarmCategory,
    HarmBlockThreshold,
)

# Allow all origins. Set origin to restrict domain access.
options.set_global_options(cors=options.CorsOptions(cors_origins="*"))

# Set and check environment variables.
project = os.environ.get("GCLOUD_PROJECT")

# Enable App Check
app_check_required = True

# Initialize Firebase.
app = firebase_admin.initialize_app()

# Define default (fallback) parameter values for Remote Config.
default_config = {
    # Default values for Vertex AI.
    "model_name": "gemini-1.5-flash-preview-0514",
    "generation_config": {
        "stop_sequences": [],
        "temperature": 0.7,
        "max_output_tokens": 64,
        "top_p": 0.1,
        "top_k": 20,
    },
    "prompt": "I'm a developer who wants to learn about Firebase and you are a "
    "helpful assistant who knows everything there is to know about Firebase!",
    "safety_settings": {
        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    # Vertex AI location.
    "location": "us-central1",
    # Disable Vertex AI Gemini API access for testing.
    "vertex_enabled": False,
}


@https_fn.on_call(
    enforce_app_check=app_check_required,
    consume_app_check_token=False,
)
def call_vertex_with_rc(req: https_fn.CallableRequest):
    try:
        # Set up Remote Config.
        rc = remoteconfig.get_remote_config()

        # Get the Remote Config template and assign default values.
        template = rc.get_template()
        config = remoteconfig.ServerTemplate(template, default_config)

        # Obtain values from Remote Config.
        text_model = config.get_string("model_name")
        text_prompt = config.get_string("prompt")
        generation_config = json.loads(config.get_string("generation_config"))
        safety_settings = json.loads(config.get_string("safety_settings"))
        location = config.get_string("location")
        vertex_enabled = config.get_bool("is_vertex_enabled")

        # Allow user input.
        user_input = req.data.get("prompt", "")

        # Instantiate Vertex AI.
        vertexai.init(project=project, location=location)
        generative_model = GenerativeModel(
            text_model,
            safety_settings=safety_settings,
            generation_config=generation_config,
        )

        # Combine prompt from Remote Config with optional user input.
        chat_input = text_prompt + " " + user_input

        if not chat_input:
            raise https_fn.HttpsError(
                https_fn.FunctionsErrorCode.INVALID_ARGUMENT, "Missing text prompt"
            )

        # Check if Vertex AI is enabled
        if not vertex_enabled:
            print("Vertex AI is not enabled")
            return

        print(
            f"\nRunning with model {text_model}, prompt: {text_prompt}, "
            f"generationConfig: {generation_config}, safetySettings: {safety_settings} in {location}\n"
        )

        result = generative_model.generate_content(chat_input, stream=True)

        chunks = []
        for item in result:
            chunk = item.candidates[0].content.parts[0].text
            print("Received chunk:", chunk)
            chunks.append(chunk)

        return "".join(chunks)  # Return the concatenated chunks
    except Exception as error:
        print(error)
        raise https_fn.HttpsError(
            https_fn.FunctionsErrorCode.INTERNAL, "Internal server error"
        )
