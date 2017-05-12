'use strict';
const admin = require('firebase-admin');
const functions = require('firebase-functions');
admin.initializeApp(functions.config().firebase);

exports.appinstalled = functions.analytics.event('first_open').onLog(event => {
    const payload = {
      notification: {
        title: 'new ' + event.data.user.deviceInfo.mobileModelName + ' from ' + event.data.user.geoInfo.city + ', ' + event.data.user.geoInfo.country,
        body: 'new ' + event.data.user.deviceInfo.mobileModelName + ' from ' + event.data.user.geoInfo.city + ', ' + event.data.user.geoInfo.country
      }
    };

     admin.messaging().sendToDevice("put_your_developer_device_token_here", payload).then(response => {
      const tokensToRemove = [];
      response.results.forEach((result, index) => {
        const error = result.error;
        if (error) {
          console.error('Failure sending notification to', tokens[index], error);
          if (error.code === 'messaging/invalid-registration-token' ||
              error.code === 'messaging/registration-token-not-registered') {
            tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());
          }
        }
      });
    });
});

exports.appremoved = functions.analytics.event('app_remove').onLog(event => {
    const payload = {
      notification: {
        title: 'lost ' + event.data.user.deviceInfo.mobileModelName + ' from ' + event.data.user.geoInfo.city + ', ' + event.data.user.geoInfo.country,
        body: 'lost ' + event.data.user.deviceInfo.mobileModelName + ' from ' + event.data.user.geoInfo.city + ', ' + event.data.user.geoInfo.country
      }
    };

     admin.messaging().sendToDevice("put_your_developer_device_token_here", payload).then(response => {
      const tokensToRemove = [];
      response.results.forEach((result, index) => {
        const error = result.error;
        if (error) {
          console.error('Failure sending notification to', tokens[index], error);
          if (error.code === 'messaging/invalid-registration-token' ||
              error.code === 'messaging/registration-token-not-registered') {
            tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());
          }
        }
      });
    });

});

