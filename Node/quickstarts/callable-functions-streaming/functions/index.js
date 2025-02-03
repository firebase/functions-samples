/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// [START full-sample]
// Dependencies for callable functions.
const {onCall, HttpsError} = require("firebase-functions/v2/https");

/**
 * Gets the weather from the national weather service
 * https://www.weather.gov/documentation/services-web-api
 *
 * @param {number} lat
 * @param {number} lng
 */
async function weatherForecastApi(lat, lng) {
  const resp = await fetch(`https://api.weather.gov/points/${lat},${lng}`);

  if (!resp.ok) {
    return `error: ${resp.status}`;
  }

  const forecastUrl = (await resp.json()).properties.forecast;
  const forecastResp = await fetch(forecastUrl);

  if (!forecastResp.ok) {
    return `error: ${forecastResp.status}`;
  }

  // add an artificial wait to emphasize stream-iness
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 1500));

  return forecastResp.json();
}

// [START streaming-callable]
exports.getForecast = onCall(async (request, response) => {
  if (request.data?.locations?.length < 1) {
    throw new HttpsError("invalid-argument", "Missing locations to forecast");
  }

  // fetch forecast data for all requested locations
  const allRequests = request.data.locations.map(
      async ({latitude, longitude}) => {
        const forecast = await weatherForecastApi(latitude, longitude);
        const result = {latitude, longitude, forecast};

        // clients that support streaming will have each
        // forecast streamed to them as they complete
        if (request.acceptsStreaming) {
          response.sendChunk(result);
        }

        return result;
      },
  );

  // Return the full set of data to all clients
  return Promise.all(allRequests);
});
// [END streaming-callable]
// [END full-sample]
