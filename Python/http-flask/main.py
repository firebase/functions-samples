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

# [START httpflaskexample]
from firebase_functions import https_fn
import flask

widget_db = ["one_widget", "two_widgets", "red_widget", "blue_widget"]
app = flask.Flask(__name__)

# Build multiple CRUD interfaces:

@app.get("/widgets")
@app.get("/widgets/<int:id>")
def get_widget(id=None):
    return widget_db if id is None else widget_db[id]

@app.post("/widgets")
def add_widget():
    new_widget = flask.request.get_data(as_text=True)
    widget_db.append(new_widget)
    return widget_db

# Expose Flask app as a single Cloud Function:

@https_fn.on_request()
def httpsflaskexample(req: https_fn.Request) -> https_fn.Response:
    with app.request_context(req.environ):
        return app.full_dispatch_request()
# [END httpflaskexample]
