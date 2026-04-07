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

// [START imports]
// Dependencies for callable functions.
import 'package:firebase_functions/firebase_functions.dart';
// [END imports]

void main(List<String> args) async {
  await fireUp(args, (firebase) {
    // [START allAdd]
    // [START addFunctionTrigger]
    // Adds two numbers to each other.
    firebase.https.onCall(name: 'addNumbers', (request, response) async {
      // [END addFunctionTrigger]
      // [START readAddData]
      // Numbers passed from the client.
      final data = request.data as Map<String, Object?>?;
      final firstNumber = data?['firstNumber'];
      final secondNumber = data?['secondNumber'];
      // [END readAddData]

      // [START addHttpsError]
      // Checking that attributes are present and are numbers.
      if (firstNumber is! num || secondNumber is! num) {
        // Throwing an HttpsError so that the client gets the error details.
        throw InvalidArgumentError(
          'The function must be called with two arguments "firstNumber" and "secondNumber" which must both be numbers.',
        );
      }
      // [END addHttpsError]

      // [START authIntegration]
      // Authentication / user information is automatically added to the request.
      final uid = request.auth?.uid;
      final token = request.auth?.token;
      final name = token?['name'];
      final picture = token?['picture'];
      final email = token?['email'];

      // Use variables to suppress 'unused' lint warnings
      print(
        'User details: uid=$uid, name=$name, picture=$picture, email=$email',
      );
      // [END authIntegration]

      // [START returnAddData]
      // returning result.
      return CallableResult({
        'firstNumber': firstNumber,
        'secondNumber': secondNumber,
        'operator': '+',
        'operationResult': firstNumber + secondNumber,
      });
      // [END returnAddData]
    });
    // [END allAdd]
  });
}
