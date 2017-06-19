const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);


exports.deleteOldItems = functions.database.ref('/path/to/items/{pushId}')
.onWrite(event => {
  var ref = event.data.ref.parent; // reference to the items
  var now = Date.now();
  var cutoff = now - 2 * 60 * 60 * 1000;
  var oldItemsQuery = ref.orderByChild('timestamp').endAt(cutoff).limitToLast(1);
  return oldItemsQuery.once('value', function(snapshot) {
    // create a map with all children that need to be removed
    var updates = {};
    snapshot.forEach(function(child) {
      updates[child.key] = null
    });
    // execute all updates in one go and return the result to end the function
    return ref.update(updates);
  });
});