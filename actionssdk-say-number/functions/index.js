// Copyright 2016, Google, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// [START app]
'use strict';

const functions = require('firebase-functions');

exports.helloWorld = functions.https.onRequest((request, response) => {

  const ActionsSdkAssistant = require('actions-on-google').ActionsSdkAssistant;
  const assistant = new ActionsSdkAssistant({request, response});

  const reprompts = [
    "I didn't hear a number",
    "If you're still there, what's the number?",
    'What is the number?'
  ];

  let actionMap = new Map();

  actionMap.set(assistant.StandardIntents.MAIN, assistant => {
    const inputPrompt = assistant.buildInputPrompt(true, `<speak>
        Hi! <break time="1"/>
        I can read out an ordinal like <say-as interpret-as="ordinal">123</say-as>.
        Say a number.
      </speak>`, reprompts
    );
    assistant.ask(inputPrompt);
  });

  actionMap.set(assistant.StandardIntents.TEXT, assistant => {
    const rawInput = assistant.getRawInput();
    if (rawInput === 'bye') {
      assistant.tell('Goodbye!');
    } else if (isNaN(parseInt(rawInput))) {
      const inputPrompt = assistant.buildInputPrompt(false, `I didn't quite get that, what was the
        number?`, reprompts);
      assistant.ask(inputPrompt);
    } else {
      const inputPrompt = assistant.buildInputPrompt(true, `<speak>
          The ordinal of <say-as interpret-as="cardinal">${rawInput}</say-as> is
          <say-as interpret-as="ordinal">${rawInput}</say-as>
        </speak>`, reprompts
      );
      assistant.ask(inputPrompt);
    }
  });

  assistant.handleRequest(actionMap);

})
// [END app]
