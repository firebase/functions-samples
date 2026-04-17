import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:multi_counter_shared/multi_counter_shared.dart';

import '../firebase_options.dart';

Future<void> initializeWorld() async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  if (kDebugMode) {
    await FirebaseAuth.instance.useAuthEmulator('127.0.0.1', 9099);
    FirebaseFirestore.instance.useFirestoreEmulator('127.0.0.1', 8080);
    FirebaseFunctions.instance.useFunctionsEmulator('127.0.0.1', 5001);
  }
}

final _options = HttpsCallableOptions(timeout: const Duration(seconds: 15));

HttpsCallable get incrementHttpsCallable => FirebaseFunctions.instance
    .httpsCallable(incrementCallable, options: _options);
