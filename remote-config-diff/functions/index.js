const functions = require('firebase-functions');
const admin = require('firebase-admin');
const rp = require('request-promise');
const jsonDiff = require('json-diff');

admin.initializeApp();

exports.showConfigDiff = functions.remoteConfig.onUpdate(versionMetadata => {
  return admin.credential.applicationDefault().getAccessToken()
    .then(accessTokenObj => {
      return accessTokenObj.access_token;
    })
    .then(accessToken => {
      const currentVersion = versionMetadata.versionNumber;
      const templatePromises = [];
      templatePromises.push(getTemplate(currentVersion, accessToken));
      templatePromises.push(getTemplate(currentVersion - 1, accessToken));

      return Promise.all(templatePromises);
    })
    .then(results => {
      const currentTemplate = results[0];
      const previousTemplate = results[1];

      const diff = jsonDiff.diffString(previousTemplate, currentTemplate);

      console.log(diff);

      return null;
    }).catch(error => {
      console.error(error);
      return null;
    });
});

function getTemplate(version, accessToken) {
  const options = {
    uri: 'https://firebaseremoteconfig.googleapis.com/v1/projects/remote-config-function/remoteConfig',
    qs: {
      versionNumber: version
    },
    headers: {
        Authorization: 'Bearer ' + accessToken
    },
    json: true // Automatically parses the JSON string in the response
  };
  return rp(options).then(resp => {
    return Promise.resolve(resp);
  }).catch(err => {
    console.error(err);
    return Promise.resolve(null);
  });
}
