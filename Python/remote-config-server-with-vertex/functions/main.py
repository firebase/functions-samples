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
from firebase_functions import https_fn
from vertexai.generative_models import (
    GenerativeModel,
    HarmCategory,
    HarmBlockThreshold,
)

# Set and check environment variables.
project = os.environ.get("GCLOUD_PROJECT")

# Initialize Firebase.
app = firebase_admin.initialize_app()

# Define default (fallback) parameter values for Remote Config.
default_config = {
    # Default values for Vertex AI.
    "model_name": "gemini-1.5-flash-002",
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
    "location": "us-central1",
    # Disable Vertex AI Gemini API access for testing.
    "vertex_enabled": False,
}


@https_fn.on_request()
def generate_with_vertex(req: https_fn.Request) -> https_fn.Response:
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
        user_input = req.args.get("prompt", "")

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
            return https_fn.Response("Missing text prompt", status=400)

        # If vertexEnabled isn't true, do not send queries to Vertex AI.
        if not vertex_enabled:
            return https_fn.Response(
                "Vertex AI call skipped. Vertex is not enabled.", status=200
            )

        print(
            f"\nRunning with model {text_model}, prompt: {text_prompt}, "
            f"generationConfig: {generation_config}, safetySettings: {safety_settings} in {location}\n"
        )

        result = generative_model.generate_content(chat_input, stream=True)

        def stream_generator():
            for item in result:
                chunk = item.candidates[0].content.parts[0].text
                print("Received chunk:", chunk)
                yield chunk

        return https_fn.Response(stream_generator(), mimetype="text/plain")

    except Exception as error:
        print(error)
        return https_fn.Response("Internal server error", status=500)
