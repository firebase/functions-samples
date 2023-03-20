# Copyright 2023 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http:#www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.'use strict';

# [START additionalimports]
from datetime import datetime
# [END additionalimports]

# [START functionsimport]
from firebase_functions import https_fn, options
# [END functionsimport]


# [START all]
# Returns the server's date. You must provide a `format` URL query parameter or `format` value in
# the request body with which we'll try to format the date.
#
# Format must follow the Python datetime library.
# See: https://docs.python.org/3.10/library/datetime.html#strftime-and-strptime-behavior
#
# Example format: "%B %d %Y, %I:%M:%S %p".
# Example request using URL query parameters:
#   https://us-central1-<project-id>.cloudfunctions.net/date?format=%25B%20%25d%20%25Y%2C%20%25I%3A%25M%3A%25S%20%25p
# Example request using request body with cURL:
#   curl -H 'Content-Type: application/json' /
#        -d '{"format": "%B %d %Y, %I:%M:%S %p"}' /
#        https://us-central1-<project-id>.cloudfunctions.net/date
#
# This endpoint supports CORS.
# [START trigger]
# [START usingMiddleware]
@https_fn.on_request(cors=options.CorsOptions(cors_origins="*",
                                              cors_methods=["get", "post"]))
def date(req: https_fn.Request) -> https_fn.Response:
# [END usingMiddleware]
# [END trigger]
    # [START sendError]
    # Forbidding PUT requests.
    if req.method == "PUT":
        return https_fn.Response(status=403, response="Forbidden!")
    # [END sendError]

    # Reading date format from URL query parameter.
    # [START readQueryParam]
    format = req.args["format"] if "format" in req.args else None
    # [END readQueryParam]
    # Reading date format from request body query parameter
    if format is None:
        # [START readBodyParam]
        body_data = req.get_json(silent=True)
        if body_data is None or "format" not in body_data:
            return https_fn.Response(status=400,
                                     response="Format string missing")
        format = body_data["format"]
        # [END readBodyParam]

    # [START sendResponse]
    formatted_date = datetime.now().strftime(format)
    print(f"Sending Formatted date: {formatted_date}")
    return https_fn.Response(formatted_date)
    # [END sendResponse]
# [END all]
