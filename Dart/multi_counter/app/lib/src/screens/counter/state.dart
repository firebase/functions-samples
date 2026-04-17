import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:multi_counter_shared/multi_counter_shared.dart';
import 'package:stream_transform/stream_transform.dart';

import '../../config_state.dart';

typedef GlobalData = ({int totalUsers, int totalClicks});

class CounterState extends ChangeNotifier {
  CounterState() {
    _incrementController.stream
        .switchMap((_) => _callIncrement().asStream())
        .listen(_handleIncrementResult);

    _initFirestore();
  }

  int userCounter = 0;
  GlobalData? globalCounter;
  bool isLoading = false;

  final _incrementController = StreamController<void>.broadcast();
  final _subscriptions = <StreamSubscription>[];
  final _responseController = StreamController<IncrementResponse>.broadcast();

  Stream<IncrementResponse> get incrementResponseStream =>
      _responseController.stream;

  void _initFirestore() {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid != null) {
      _subscriptions.add(
        FirebaseFirestore.instance
            .collection(usersCollection)
            .doc(uid)
            .withConverter<int>(
              fromFirestore: (snapshot, _) =>
                  snapshot.data()?[countField] as int? ?? 0,
              toFirestore: (value, _) => {countField: value},
            )
            .snapshots()
            .listen((snapshot) {
              if (snapshot.exists) {
                userCounter = snapshot.data() ?? 0;
                notifyListeners();
              }
            }),
      );

      _subscriptions.add(
        FirebaseFirestore.instance
            .collection(globalCollection)
            .doc(varsDocument)
            .withConverter<GlobalData?>(
              fromFirestore: (snapshot, _) {
                final data = snapshot.data();
                if (data != null &&
                    data.containsKey(totalCountField) &&
                    data.containsKey(totalUsersField)) {
                  return (
                    totalClicks: data[totalCountField] as int,
                    totalUsers: data[totalUsersField] as int,
                  );
                }
                return null;
              },
              toFirestore: (data, _) => {
                totalCountField: data?.totalClicks,
                totalUsersField: data?.totalUsers,
              },
            )
            .snapshots()
            .listen((snapshot) {
              if (snapshot.exists) {
                globalCounter = snapshot.data();
                notifyListeners();
              }
            }),
      );
    } else {
      print('no uid');
    }
  }

  void increment() {
    if (isLoading) return;
    isLoading = true;
    notifyListeners();
    _incrementController.add(null);
  }

  Future<IncrementResponse?> _callIncrement() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      return IncrementResponse.failure('User is not authenticated.');
    }

    final idToken = await user.getIdToken();
    if (idToken == null) {
      return IncrementResponse.failure('User is not authenticated.');
    }

    try {
      final result = await incrementHttpsCallable.call<Map<String, dynamic>>();
      return IncrementResponse.fromJson(result.data);
    } on FirebaseFunctionsException catch (e) {
      print('Error calling increment: ${e.code} ${e.message}');
      return IncrementResponse.failure('Error: ${e.code}');
    } catch (e) {
      print('Error calling increment: $e');
      return IncrementResponse.failure('Unknown error occurred.');
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void _handleIncrementResult(IncrementResponse? result) {
    if (result != null) {
      _responseController.add(result);
    }
  }

  @override
  void dispose() {
    _responseController.close();
    _incrementController.close();
    for (final sub in _subscriptions) {
      sub.cancel();
    }
    super.dispose();
  }
}
