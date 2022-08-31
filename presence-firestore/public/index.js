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
    // `push()` will add a new key to the user's path, acting as a sessionId
    var sessionStatusDatabaseRef = firebase.database().ref('/status/' + uid + '/sessions').push();

    // We'll create two constants which we will write to 
    // the Realtime database when this session is offline
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
    firebase.database().ref('.info/connected').on('value', function(snapshot) {
        // If we're not currently connected, don't do anything.
        if (snapshot.val() == false) {
            return;
        };

        // If we are currently connected, then use the 'onDisconnect()' 
        // method to add a set which will only trigger once this 
        // client has disconnected by closing the app, 
        // losing internet, or any other means.
        sessionStatusDatabaseRef.onDisconnect().set(isOfflineForDatabase).then(function() {
            // The promise returned from .onDisconnect().set() will
            // resolve as soon as the server acknowledges the onDisconnect() 
            // request, NOT once we've actually disconnected:
            // https://firebase.google.com/docs/reference/js/firebase.database.OnDisconnect

            // We can now safely set ourselves as 'online' knowing that the
            // server will mark us as offline once we lose connection.
            sessionStatusDatabaseRef.set(isOnlineForDatabase);
        });
    });
    // [END rtdb_presence]
}

async function rtdb_and_local_fs_presence() {
    // [START rtdb_and_local_fs_presence]
    // [START_EXCLUDE]
    var uid = firebase.auth().currentUser.uid;
    var sessionStatusDatabaseRef = await firebase.database().ref('/status/' + uid + '/sessions').push();
    var sessionId = sessionStatusDatabaseRef.key;
    console.log('my ID', sessionId);

    var isOfflineForDatabase = {
        state: 'offline',
        last_changed: firebase.database.ServerValue.TIMESTAMP,
    };

    var isOnlineForDatabase = {
        state: 'online',
        last_changed: firebase.database.ServerValue.TIMESTAMP,
    };

    // [END_EXCLUDE]
    var userFirestoreRef = firebase.firestore().collection('status').doc(uid);
    await userFirestoreRef.set({ uid }); // In case the user's id document doesn't already exist.
    
    var sessionsCollectionRef = userFirestoreRef.collection('sessions');
    var sessionStatusFirestoreRef = sessionsCollectionRef.doc(sessionId);


    // Firestore uses a different server timestamp value, so we'll 
    // create two more constants for Firestore state.
    var isOnlineForFirestore = {
        state: 'online',
        last_changed: firebase.firestore.FieldValue.serverTimestamp(),
    };

    // When a user goes offline, it reads from the cache to know how many sessions are left.
    // This listener is to ensure that the full session cache is populated and can be read from when offline.
    sessionsCollectionRef.onSnapshot(() => {});

    firebase.database().ref('.info/connected').on('value', async function(snapshot) {
        if (snapshot.val() === false) {
            // Instead of simply returning, we'll also remove the session id from the user, 
            // and if no sessions are left, we should delete the user as well.
            // This ensures that our Firestore cache is aware that the session and/or user has been deleted
            sessionStatusFirestoreRef.delete().then(() => console.log('session deletion completed'));
            const sessionCollection = await sessionsCollectionRef.get();
            if(sessionCollection.empty) {
                userFirestoreRef.delete().then(() => console.log('user deletion completed'));
            }
            return;
        };
        const sessionCollection = await sessionsCollectionRef.get();
        console.log(sessionCollection);

        sessionStatusDatabaseRef.onDisconnect().set(isOfflineForDatabase).then(function() {
            sessionStatusDatabaseRef.set(isOnlineForDatabase);

            // We'll also add Firestore set here for when we come online.
            userFirestoreRef.set({ uid });
            sessionStatusFirestoreRef.set(isOnlineForFirestore);
        });
    });
    // [END rtdb_and_local_fs_presence]
}

function fs_listen() {
    // [START fs_onsnapshot]
    userStatusFirestoreRef.onSnapshot(function(doc) {
        var isOnline = !doc.empty;
        // ... use isOnline
    });
    // [END fs_onsnapshot]
}

function fs_listen_online() {
    var history = document.querySelector('#history');
    // [START fs_onsnapshot_online]
    firebase.firestore().collection('status')
        .onSnapshot(function(snapshot) {
            snapshot.docChanges().forEach(function(change) {
                if (change.type === 'added') {
                    var msg = 'User ' + change.doc.id + ' is online.';
                    console.log(msg);
                    // [START_EXCLUDE]
                    history.innerHTML += msg + '<br />';
                    // [END_EXCLUDE]
                }
                if (change.type === 'removed') {
                    var msg = 'User ' + change.doc.id + ' is offline.';
                    console.log(msg);
                    // [START_EXCLUDE]
                    history.innerHTML += msg + '<br />'
                    // [END_EXCLUDE]
                }
            });
        });
    // [END fs_onsnapshot_online]
}
const db = firebase.database();
const firestore = firebase.firestore();
db.useEmulator("localhost", 9000);
firestore.useEmulator("localhost", 8080);


firebase.auth().signInAnonymously().then(function() {
    rtdb_and_local_fs_presence();
    fs_listen_online();
}).catch(function(err) {
    console.warn(err);
    console.warn('Please enable Anonymous Authentication in your Firebase project!');
});
