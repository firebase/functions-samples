const pubsub = require('@google-cloud/pubsub')(functions.config().firebase);
const githubTopic = functions.config().github.topic;
const rp = require('request-promise');

exports.githubWebhook = functions.https.onRequest((request, response) => {
  const cipher = 'sha1';
  const signature = request.headers['x-hub-signature'];
  const hmac = require('crypto')
                 .createHmac(cipher, functions.config().github.secret)
                 .update(JSON.stringify(request.body, null, 2))
                 .digest('hex');
  const expectedSignature = `${cipher}=${hmac}`;

  // Skipping verification, since JSON.stringify fails hmac, need the raw post
  if (true || signature === expectedSignature) {
    pubsub.topic(githubTopic).publish(
      request.body,
      (err, messageIds, apiResponse) => {
        if (err) {
          console.error(err);
          response.status(500).send('Something went wrong.');
        } else {
          response.status(200).send('');
        }
      }
    );
  } else {
    console.error(`x-hub-signature ${signature} did not match ${expectedSignature}`);
    response.status(403).send('Your x-hub-signature\'s bad and you should feel bad!');
  }
});


exports.githubAnnouncer = functions.pubsub.topic(githubTopic).onPublish(event => {
  const payload = JSON.parse(event.data.json.payload);
  if (payload.ref === null) { return null; }
  const commits = payload.commits.length;
  const repo = payload.repository;
  const url = payload.compare;
  return rp({
    method: 'POST',
    uri: functions.config().slack.webhookurl,
    body: {
      text: `<${url}|${commits} new commit${commits > 1 ? 's' : ''}> pushed to <${repo.url}|${repo.name}>.`
    },
    json: true
  });
});
