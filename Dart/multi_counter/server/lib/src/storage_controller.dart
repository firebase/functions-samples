import 'package:google_cloud_firestore/google_cloud_firestore.dart';
import 'package:multi_counter_shared/multi_counter_shared.dart';

class StorageController {
  final Firestore _firestore;

  StorageController(this._firestore);

  Future<void> increment(String userId) async {
    try {
      await _increment(userId);
    } catch (e, stack) {
      print('Error incrementing counter for user: $userId');
      print(e);
      print(stack);
      rethrow;
    }
  }

  Future<void> _increment(String userId) async {
    await _firestore.runTransaction<void>((transaction) async {
      final userRef = _firestore.collection(usersCollection).doc(userId);
      final globalRef = _firestore
          .collection(globalCollection)
          .doc(varsDocument);

      final snapshot = await transaction.get(userRef);

      if (!snapshot.exists) {
        // Document doesn't exist, create it with count = 1
        transaction.set(userRef, _saveCount(1));
        transaction.update(globalRef, {
          totalCountField: const FieldValue.increment(1),
          totalUsersField: const FieldValue.increment(1),
        });
      } else {
        final data = snapshot.data();
        if (data != null && data.containsKey(countField)) {
          // Field exists, increment it
          transaction.update(userRef, {
            countField: const FieldValue.increment(1),
          });
        } else {
          // Field doesn't exist, initialize it to 1
          transaction.update(userRef, _saveCount(1));
        }
        transaction.update(globalRef, {
          totalCountField: const FieldValue.increment(1),
        });
      }
    });
  }

  Future<void> close() async {
    await _firestore.terminate();
  }
}

Map<String, dynamic> _saveCount(int count) => {countField: count};
