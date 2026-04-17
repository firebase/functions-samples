import 'package:google_cloud_firestore/google_cloud_firestore.dart';
import 'package:multi_counter_shared/multi_counter_shared.dart';

class StorageController {
  final Firestore _firestore;

  StorageController(this._firestore);

  Future<void> increment(String userId) async {
    try {
      await _increment(userId);
      await _updateGlobalCount();
    } catch (e, stack) {
      print('Error incrementing counter for user: $userId');
      print(e);
      print(stack);
      rethrow;
    }
  }

  Future<void> _increment(String userId) async {
    await _firestore.runTransaction<void>((transaction) async {
      final ref = _firestore.collection(usersCollection).doc(userId);

      final snapshot = await transaction.get(ref);

      if (!snapshot.exists) {
        // Document doesn't exist, create it with count = 1
        transaction.set(ref, _saveCount(1));
      } else {
        final data = snapshot.data();
        if (data != null && data.containsKey(countField)) {
          // Field exists, increment it
          transaction.update(ref, {countField: const FieldValue.increment(1)});
        } else {
          // Field doesn't exist, initialize it to 1
          transaction.update(ref, _saveCount(1));
        }
      }
    });
  }

  Future<void> _updateGlobalCount() async {
    final globalCountSnapshot = await _firestore
        .collection(usersCollection)
        .aggregate(const sum(countField), const count())
        .get();

    var globalCountRaw = globalCountSnapshot.getSum(countField);

    if (globalCountRaw == null || globalCountRaw < 1) {
      // TODO: we don't want to crash here, but we should log
      print('Very weird value for global count: "$globalCountRaw');
      globalCountRaw = 1;
    }

    final globalCountValue = globalCountRaw.toInt();
    final userCountValue = globalCountSnapshot.count;

    final globalVars = _firestore
        .collection(globalCollection)
        .doc(varsDocument);

    // TODO: Investigate a more efficient way to do this
    // Maybe with a trigger?
    await globalVars.set({
      totalCountField: globalCountValue,
      totalUsersField: userCountValue,
    });
  }

  Future<void> close() async {
    await _firestore.terminate();
  }
}

Map<String, dynamic> _saveCount(int count) => {countField: count};
