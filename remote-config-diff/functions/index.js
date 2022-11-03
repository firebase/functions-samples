const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const jsonDiff = require('json-diff');

admin.initializeApp();

// [START remote_config_function]
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

      functions.logger.log(diff);

      return null;
    }).catch(error => {
      functions.logger.error(error);
      return null;
    });
});
// [END remote_config_function]

async function getTemplate(version, accessToken) {
  const params = new URLSearchParams();
  params.append("versionNumber", version);
  const response = await fetch(
    "https://firebaseremoteconfig.googleapis.com/v1/projects/remote-config-function/remoteConfig",
    {
      method: "POST",
      body: params,
      headers: { Authorization: "Bearer " + accessToken },
    }
  );
  return response.json();
}

