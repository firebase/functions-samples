# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# [START full-sample]
import random
import time
from typing import Any

import requests
from firebase_admin import initialize_app
from firebase_functions import https_fn

initialize_app()


def weather_forecast_api(lat: float, lng: float) -> dict[str, Any] | str:
    resp = requests.get(f"https://api.weather.gov/points/{lat},{lng}")
    if not resp.ok:
        return f"error: {resp.status_code}"

    forecast_url = resp.json().get("properties", {}).get("forecast")
    forecast_resp = requests.get(forecast_url)
    if not forecast_resp.ok:
        return f"error: {forecast_resp.status_code}"

    # add an artificial wait to emphasize stream-iness
    time.sleep(random.random() * 1.5)

    return forecast_resp.json()


# [START streaming-callable]
@https_fn.on_call()
def get_forecast(req: https_fn.CallableRequest) -> Any:
    locations = req.data.get("locations", [])
    if not locations:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="Missing locations to forecast",
        )

    for loc in locations:
        lat = loc.get("latitude")
        lng = loc.get("longitude")
        forecast = weather_forecast_api(lat, lng)
        yield {
            "latitude": lat,
            "longitude": lng,
            "forecast": forecast
        }

# [END streaming-callable]
# [END full-sample]
