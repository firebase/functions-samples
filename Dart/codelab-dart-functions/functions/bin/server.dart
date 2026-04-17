import 'dart:convert';
import 'package:firebase_functions/firebase_functions.dart';
import 'package:google_cloud_firestore/google_cloud_firestore.dart'
    show FieldValue;
import 'package:shared/shared.dart';

void main(List<String> args) async {
  await fireUp(args, (firebase) {
    // Listen for calls to the http request and name defined in the shared package.
    firebase.https.onRequest(name: incrementCallable, (request) async {
      // In a production app, verify the user with request.auth?.uid here.
      // ignore: avoid_print
      print('Incrementing counter on the server...');

      // Get firestore database instance
      final firestore = firebase.adminApp.firestore();

      // Get a reference to the counter document
      final counterDoc = firestore.collection('counters').doc('global');

      // Get the current snapshot for the count data
      final snapshot = await counterDoc.get();

      // Increment response we will send back
      IncrementResponse incrementResponse;

      // Check for the current count and if the snapshot exists
      if (snapshot.data() case {'count': int value} when snapshot.exists) {
        if (request.method == 'GET') {
          // Get the current result
          incrementResponse = IncrementResponse(
            success: true,
            message: 'Read-only sync complete',
            newCount: value,
          );
        } else if (request.method == 'POST') {
          // Increment count by one
          final step = int.tryParse(request.url.queryParameters['step'] ?? '') ?? 1;
          await counterDoc.update({'count': FieldValue.increment(step)});
          incrementResponse = IncrementResponse(
            success: true,
            message: 'Atomic increment complete',
            newCount: value + step,
          );
        } else {
          throw FailedPreconditionError(
            'only GET and POST requests are allowed',
          );
        }
      } else {
        // Create a new document with a count of 1
        await counterDoc.set({'count': 1});
        incrementResponse = const IncrementResponse(
          success: true,
          message: 'Cloud-sync complete',
          newCount: 1,
        );
      }

      // Return the response as JSON
      return Response(
        200,
        body: jsonEncode(incrementResponse.toJson()),
        headers: {'Content-Type': 'application/json'},
      );
    });
  });
}
