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

// [START dartHttpImport]
import 'package:firebase_functions/firebase_functions.dart';
// [END dartHttpImport]

// [START dartHttpAdditionalImports]
import 'dart:convert';
import 'package:intl/intl.dart';
// [END dartHttpAdditionalImports]

// [START dartHttpAll]
/// Returns the server's date.
/// Options `timeoutSeconds` and `region` are optional.
///
/// You must provide a `format` URL query parameter or `format` value in
/// the request body with which we'll try to format the date.
///
/// Format must follow the Dart intl library. See: https://pub.dev/packages/intl
///
/// Example format: "MMMM d yyyy, h:mm:ss a".
/// Example request using URL query parameters:
///   https://date-<random-hash>.<region>.run.app?format=MMMM%20d%20yyyy%2C%20h%3Amm%3Ass%20a
/// Example request using request body with cURL:
///   curl -H 'Content-Type: application/json' /
///        -d '{"format": "MMMM d yyyy, h:mm:ss a"}' /
///        https://date-<random-hash>.<region>.run.app
// [START dartHttpTrigger]
void main(List<String> args) async {
  await fireUp(args, (firebase) {
    firebase.https.onRequest(name: 'date', (request) async {
      // [END dartHttpTrigger]

      // [START dartHttpSendError]
      // Forbidding PUT requests.
      if (request.method == 'PUT') {
        return Response.forbidden('Forbidden!');
      }
      // [END dartHttpSendError]

      // Reading date format from URL query parameter.
      // [START dartHttpReadQueryParam]
      var format = request.url.queryParameters['format'];
      // [END dartHttpReadQueryParam]

      // Reading date format from request body query parameter
      if (format == null) {
        // [START dartHttpReadBodyParam]
        final bodyString = await request.readAsString();
        try {
          if (bodyString.isNotEmpty) {
            final body = jsonDecode(bodyString) as Map<String, dynamic>;
            format = body['format'] as String?;
          }
        } catch (e) {
          return Response.badRequest(body: 'invalid JSON');
        }
        // [END dartHttpReadBodyParam]
      }

      // Set a default format if none was provided
      format ??= 'MMMM d yyyy, h:mm:ss a';

      // [START dartHttpSendResponse]
      final formattedDate = DateFormat(format).format(DateTime.now());
      print('Sending formatted date: $formattedDate');
      return Response.ok(formattedDate);
      // [END dartHttpSendResponse]
    });
  });
}

// [END dartHttpAll]
