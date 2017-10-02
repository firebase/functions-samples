/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function rtdb_presence() {
    // [START rtdb_presence]
    // Fetch the current user's ID from Firebase Authentication.
    var uid = firebase.auth().currentUser.uid;

    // Create a reference to this user's specific status node.
    // This is where we will store data about being online/offline.
    var userStatusDatabaseRef = firebase.database().ref(`/status/${uid}`);

    // We'll create two constants which we will write to 
    // the Realtime database when this device is offline
    // or online.
    var isOfflineForDatabase = {
        state: 'offline',
        last_changed: firebase.database.ServerValue.TIMESTAMP,
    };

    var isOnlineForDatabase = {
        state: 'online',
        last_changed: firebase.database.ServerValue.TIMESTAMP,
    };

    // Create a reference to the special '.info/connected' path in 
    // Realtime Database. This path returns `true` when connected
    // and `false` when disconnected.
    firebase.database().ref('.info/connected').on('value', function (snapshot) {
        // If we're not currently connected, don't do anything.
        if (snapshot.val() == false) {
            return;
        };

        // If we are currently connected, then use the 'onDisconnect()' 
        // method to add a set which will only trigger once this 
        // client has disconnected by closing the app, 
        // losing internet, or any other means.
        userStatusDatabaseRef.onDisconnect().set(isOfflineForDatabase).then(function () {
            // The promise returned from .onDisconnect().set() will
            // resolve as soon as the server acknowledges the onDisconnect() 
            // request, NOT once we've actually disconnected:
            // https://firebase.google.com/docs/reference/js/firebase.database.OnDisconnect

            // We can now safely set ourselves as 'online' knowing that the
            // server will mark us as offline once we lose connection.
            userStatusDatabaseRef.set(isOnlineForDatabase);
        });
    });
    // [END rtdb_presence]
}

function rtdb_and_local_fs_presence() {
    // [START rtdb_and_local_fs_presence]
    // [START_EXCLUDE]
    var uid = firebase.auth().currentUser.uid;
    var userStatusDatabaseRef = firebase.database().ref(`/status/${uid}`);

    var isOfflineForDatabase = {
        state: 'offline',
        last_changed: firebase.database.ServerValue.TIMESTAMP,
    };

    var isOnlineForDatabase = {
        state: 'online',
        last_changed: firebase.database.ServerValue.TIMESTAMP,
    };

    // [END_EXCLUDE]
    var userStatusFirestoreRef = firebase.firestore().doc(`/status/${uid}`);

    // Firestore uses a different server timestamp value, so we'll 
    // create two more constants for Firestore state.
    var isOfflineForFirestore = {
        state: 'offline',
        last_changed: firebase.firestore.FieldValue.serverTimestamp(),
    };

    var isOnlineForFirestore = {
        state: 'online',
        last_changed: firebase.firestore.FieldValue.serverTimestamp(),
    };

    firebase.database().ref('.info/connected').on('value', function (snapshot) {
        if (snapshot.val() == false) {
            // Instead of simply returning, we'll also set Firestore's state
            // to 'offline'. This ensures that our Firestore cache is aware
            // of the switch to 'offline.'
            userStatusFirestoreRef.set(isOfflineForFirestore);
            return;
        };

        userStatusDatabaseRef.onDisconnect().set(isOfflineForDatabase).then(function () {
            userStatusDatabaseRef.set(isOnlineForDatabase);

            // We'll also add Firestore set here for when we come online.
            userStatusFirestoreRef.set(isOnlineForFirestore);
        });
    });
    // [END rtdb_and_local_fs_presence]
}

function fs_listen() {
    // [START fs_onsnapshot]
    userStatusFirestoreRef.onSnapshot(function (doc) {
        var isOnline = doc.data().state == 'online';
        // ... use isOnline
    });
    // [END fs_onsnapshot]
}

function fs_listen_online() {
    var history = document.querySelector('#history');
    // [START fs_onsnapshot_online]
    firebase.firestore().collection('status')
        .where('state', '==', 'online')
        .onSnapshot(function (snapshot) {
            snapshot.docChanges.forEach(function (change) {
                if (change.type === 'added') {
                    var msg = `User ${change.doc.id} is online.`;
                    console.log(msg);
                    // [START_EXCLUDE]
                    history.innerHTML += msg + '<br />';
                    // [END_EXCLUDE]
                }
                if (change.type === 'removed') {
                    var msg = `User ${change.doc.id} is offline.`;
                    console.log(msg);
                    // [START_EXCLUDE]
                    history.innerHTML += msg + '<br />'
                    // [END_EXCLUDE]
                }
            });
        });
    // [END fs_onsnapshot_online]
}

firebase.auth().signInAnonymously().then(function () {
    rtdb_and_local_fs_presence();
    fs_listen_online();
}).catch(function (err) {
    console.warn(err);
    console.warn('Please enable Anonymous Authentication in your Firebase project!');
});