const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.applicationDefault()
});
const db = admin.firestore();


exports.onUserUpdateAvatar = functions.firestore
    .document('User/{usrId}')
    .onUpdate( async (snap, context) => {
        const afterData = snap.after.data();
        const beforeData = snap.before.data();

        const idUsr = beforeData.id;

        const avatarBefore = beforeData.avatar;
        const avatarAfter = afterData.avatar;

        if (avatarAfter !== '') {
            getDocExists(avatarBefore, avatarAfter, idUsr)
        } else {
            await db.collection('User').doc(idUsr)
                .update({'avatar': avatarBefore});
            console.error('Do you have change on empty avatar id in user:', idUsr)
        }


    });

function getDocExists(beforeAvatar, afterAvatar, idUser) {
    const coll = db.collection('User_Photo/' + idUser + '/Photos');
    db.collection('User_Photo/' + idUser + '/Photos').doc(afterAvatar).get().then(async doc => {
        if (doc.exists) {
            await coll.doc(afterAvatar).update({'avatar': true});
            console.log('User - ' + idUser + ', update photo from ' + beforeAvatar + ' to ' + afterAvatar);

            coll.where('avatar', '==', true).get().then(async docs => {
                docs.docs.forEach(doc => {
                    const docData = doc.data();
                    if (afterAvatar !== docData.idPhoto) {
                        coll.doc(docData.idPhoto).update({'avatar': false});
                    }
                })
            })
        } else {
            db.collection('User').doc(idUser)
                .update({'avatar': beforeAvatar})
            console.error('User: ' + idUser + ', tried to update a nonexistent avatar '
                + beforeAvatar + ' to '
                + afterAvatar)
        }
    })
}


