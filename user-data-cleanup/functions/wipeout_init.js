'use strict';

const request = require('request');

if (typeof process.argv[2] === 'undefined'){
	console.error("Please provide project ID as an argument. Check project ID using firebase list, look for the project name with (curent)");
	process.exit();
}
const project = process.argv[2];

request.post({
  url:     `https://us-central1-${project}.cloudfunctions.net/showWipeoutConfig`,
  body:    "confirm=Reset"
}, function(error, response, body){
  console.log(body);
});

