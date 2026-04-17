import 'package:firebase_functions/firebase_functions.dart';
import 'package:multi_counter_server/src/storage_controller.dart';
import 'package:multi_counter_shared/multi_counter_shared.dart';

void main(List<String> args) async {
  await fireUp(args, (firebase) async {
    final storageController = StorageController(firebase.adminApp.firestore());

    firebase.https.onCall(
      name: incrementCallable,

      options: const CallableOptions(
        // TODO: should be explicit here about the supported hosts
        cors: OptionLiteral(['*']),
      ),
      (request, response) async {
        if (request.auth case AuthData auth?) {
          await storageController.increment(auth.uid);
          return CallableResult('success');
        } else {
          throw UnauthenticatedError();
        }
      },
    );
  });
}
