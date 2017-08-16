'use strict';

const request = require('request');

if (typeof process.argv[2] === 'undefined') {
  console.log(
      'Please provide project ID as an argument. Check project ID using\n' +
        'firebase list, looking for the project name with (current)'
  );
  process.exit();
}
const project = process.argv[2];

request.post(
    {
      url: `https://us-central1-${project}.cloudfunctions.net/showWipeoutConfig`,
      body: 'confirm=Reset'
    },
    (error, response, body) => console.log(body)
);
