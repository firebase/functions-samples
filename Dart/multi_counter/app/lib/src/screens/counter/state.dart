import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:multi_counter_shared/multi_counter_shared.dart';
import 'package:stream_transform/stream_transform.dart';

import '../../config_state.dart';

typedef GlobalData = ({int totalUsers, int totalClicks});

class CounterState {
  CounterState() {
    _incrementController.stream
        .switchMap((_) => _callIncrement().asStream())
        .listen(_handleIncrementResult);

    _initFirestore();
  }

  final ValueNotifier<int> userCounter = ValueNotifier(0);
  final ValueNotifier<GlobalData?> globalCounter = ValueNotifier(null);

  final _incrementController = StreamController<void>.broadcast();
  final _subscriptions = <StreamSubscription>[];
  final _responseController = StreamController<IncrementResponse>.broadcast();

  Stream<IncrementResponse> get incrementResponseStream =>
      _responseController.stream;

  // TODO: consider creating shared constants for collection and field names.
  // ...and putting them in the shared package.
  void _initFirestore() {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid != null) {
      _subscriptions.add(
        FirebaseFirestore.instance
            .collection(usersCollection)
            .doc(uid)
            .snapshots()
            .listen((snapshot) {
              if (snapshot.exists) {
                final data = snapshot.data();
                if (data != null && data.containsKey(countField)) {
                  userCounter.value = data[countField] as int;
                }
              }
            }),
      );

      _subscriptions.add(
        FirebaseFirestore.instance
            .collection(globalCollection)
            .doc(varsDocument)
            .snapshots()
            .listen((snapshot) {
              if (snapshot.data() case {
                totalCountField: int totalClicks,
                totalUsersField: int totalUsers,
              }) {
                globalCounter.value = (
                  totalUsers: totalUsers,
                  totalClicks: totalClicks,
                );
              }
            }),
      );
    } else {
      print('no uid');
    }
  }

  // TODO: consider making this a nullable-property and disabling
  // the button when we're waiting for the function to complete.
  void increment() {
    _incrementController.add(null);
  }

  Future<void> _callIncrement() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      _responseController.add(
        IncrementResponse.failure('User is not authenticated.'),
      );
      return;
    }

    final idToken = await user.getIdToken();
    if (idToken == null) {
      _responseController.add(
        IncrementResponse.failure('User is not authenticated.'),
      );
      return;
    }

    try {
      await incrementHttpsCallable.call<void>();
    } on FirebaseFunctionsException catch (e) {
      print('Error calling increment: ${e.code} ${e.message}');
      _responseController.add(IncrementResponse.failure('Error: ${e.code}'));
    }
  }

  void _handleIncrementResult(_) {
    // TODO: handle the result
  }

  void dispose() {
    _responseController.close();
    _incrementController.close();
    for (final sub in _subscriptions) {
      sub.cancel();
    }
  }
}
