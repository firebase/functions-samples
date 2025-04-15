/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";

const functions = require("firebase-functions/v1");
const { actionssdk } = require("actions-on-google");

const app = actionssdk();
app.intent("actions.intent.MAIN", (conv) => {
  conv.ask(`<speak>
      Hi! <break time="1"/>
      I can read out an ordinal number like <say-as interpret-as="ordinal">123</say-as>.
      Say a number.
    </speak>`);
});

app.intent("actions.intent.TEXT", (conv) => {
  const rawInput = conv.input.raw;
  if (rawInput === "bye") {
    conv.ask("Goodbye!");
  } else if (isNaN(parseInt(rawInput, 10))) {
    conv.ask("I didn't quite get that, what was the number?");
  } else {
    conv.ask(`<speak>
      The ordinal of <say-as interpret-as="cardinal">${rawInput}</say-as> is
      <say-as interpret-as="ordinal">${rawInput}</say-as>
    </speak>`);
  }
});

/**
 * Endpoint which handles requests for a Google Assistant action which asks users to say a number
 * and read out the ordinal of that number.
 * e.g. If the user says "Twelve" the action will say "The ordinal of twelve is twelfth".
 */
exports.sayNumber = functions.https.onRequest(app);
