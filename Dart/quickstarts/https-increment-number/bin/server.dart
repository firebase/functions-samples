import 'dart:convert';
import 'package:dart_firebase_admin/dart_firebase_admin.dart';
import 'package:firebase_functions/firebase_functions.dart';
import 'package:google_cloud_firestore/google_cloud_firestore.dart';

class IncrementResponse {
  final String message;
  final int newCount;

  IncrementResponse({required this.message, required this.newCount});

  Map<String, dynamic> toJson() => {'message': message, 'newCount': newCount};
}

void main(List<String> args) async {
  await fireUp(args, (firebase) {
    // [START dartHttpIncrementLocal]
    firebase.https.onRequest(name: 'incrementLocal', (request) async {
      print('Incrementing counter locally...');

      if (request.method != 'POST') {
        return Response(405, body: 'Method Not Allowed');
      }

      int currentCount = 0;
      final bodyString = await request.readAsString();
      if (bodyString.isNotEmpty) {
        try {
          final body = jsonDecode(bodyString) as Map<String, dynamic>;
          currentCount = body['count'] as int? ?? 0;
        } catch (e) {
          return Response.badRequest(body: 'Invalid JSON request');
        }
      }

      final response = IncrementResponse(
        message: 'Local increment complete!',
        newCount: currentCount + 1,
      );

      return Response(
        200,
        body: jsonEncode(response.toJson()),
        headers: {'Content-Type': 'application/json'},
      );
    });
    // [END dartHttpIncrementLocal]

    // [START dartHttpIncrementSynced]
    firebase.https.onRequest(name: 'incrementSynced', (request) async {
      print('Processing synced counter request...');

      // Get firestore admin instance
      final firestore = FirebaseApp.instance.firestore();

      // Get a reference to the counter document
      final counterDoc = firestore.collection('counters').doc('global');

      // Fetch the current counter value
      final snapshot = await counterDoc.get();
      final currentCount = snapshot.data()?['count'] as int? ?? 0;

      if (request.method == 'GET') {
        // Handle GET request to respond with the current counter
        final response = IncrementResponse(
          message: 'Cloud-sync fetched!',
          newCount: currentCount,
        );

        return Response(
          200,
          body: jsonEncode(response.toJson()),
          headers: {'Content-Type': 'application/json'},
        );
      } else if (request.method == 'POST') {
        // Handle POST request to increment the counter

        // Increment count by one
        await counterDoc.set({
          'count': FieldValue.increment(1),
        }, options: SetOptions.merge());

        final response = IncrementResponse(
          message: 'Cloud-sync complete!',
          newCount: currentCount + 1,
        );

        return Response(
          200,
          body: jsonEncode(response.toJson()),
          headers: {'Content-Type': 'application/json'},
        );
      } else {
        return Response(405, body: 'Method Not Allowed');
      }
    });
    // [END dartHttpIncrementSynced]
  });
}
