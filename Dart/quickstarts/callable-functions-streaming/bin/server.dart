// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// [START full-sample]
// Dependencies for callable functions.
import 'dart:convert';
import 'dart:math';

import 'package:firebase_functions/firebase_functions.dart';
import 'package:http/http.dart' as http;

/// Gets the weather from the national weather service
/// https://www.weather.gov/documentation/services-web-api
Future<dynamic> weatherForecastApi(num lat, num lng) async {
  final resp = await http.get(
    Uri.parse('https://api.weather.gov/points/$lat,$lng'),
  );

  if (resp.statusCode >= 400) {
    return 'error: ${resp.statusCode}';
  }

  final pointData = jsonDecode(resp.body) as Map<String, dynamic>;
  final forecastUrl = pointData['properties']['forecast'] as String;
  final forecastResp = await http.get(Uri.parse(forecastUrl));

  if (forecastResp.statusCode >= 400) {
    return 'error: ${forecastResp.statusCode}';
  }

  // add an artificial wait to emphasize stream-iness
  final randomWait = Random().nextDouble() * 1500;
  await Future<void>.delayed(Duration(milliseconds: randomWait.toInt()));

  return jsonDecode(forecastResp.body);
}

void main(List<String> args) async {
  await fireUp(args, (firebase) {
    // [START streaming-callable]
    firebase.https.onCall(name: 'getForecast', (request, response) async {
      final data = request.data as Map<String, Object?>?;
      final locations = data?['locations'] as List<dynamic>?;

      if (locations == null || locations.isEmpty) {
        throw InvalidArgumentError('Missing locations to forecast');
      }

      // fetch forecast data for all requested locations
      final allRequests = locations.map((location) async {
        if (location case {
          'latitude': num latitude,
          'longitude': num longitude,
        }) {
          final forecast = await weatherForecastApi(latitude, longitude);
          final result = {
            'latitude': latitude,
            'longitude': longitude,
            'forecast': forecast,
          };

          // clients that support streaming will have each
          // forecast streamed to them as they complete
          if (request.acceptsStreaming) {
            await response.sendChunk(result);
          }

          return result;
        }

        throw InvalidArgumentError('Invalid location format');
      });

      // Return the full set of data to all clients
      return CallableResult(await Future.wait(allRequests));
    });
    // [END streaming-callable]
  });
}

// [END full-sample]
