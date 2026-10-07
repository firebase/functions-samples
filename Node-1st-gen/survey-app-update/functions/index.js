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
'use strict';

const functions = require('firebase-functions/v1');
const {onInit} = require('firebase-functions/v1');
const {defineSecret} = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
initializeApp();
const {Resend} = require('resend');

// Emails are sent with Resend (https://resend.com/).
// TODO: Store your Resend API key in the `EMAIL_API_KEY` secret with `firebase functions:secrets:set EMAIL_API_KEY`.
const emailApiKey = defineSecret('EMAIL_API_KEY');

let resend;
onInit(() => {
  resend = new Resend(emailApiKey.value());
});

// TODO: Create your own survey.
const LINK_TO_SURVEY = 'https://example.com/survey';
const LATEST_VERSION = '2.0';

/**
 * After a user has updated the app. Send them a survey to compare the app with the old version.
 */
exports.sendAppUpdateSurvey = functions.runWith({secrets: [emailApiKey]}).analytics.event('app_update').onLog(async (event) => {
  const uid = event.user.userId;
  const appVerion = event.user.appInfo.appVersion;

  // Check that the user has indeed upgraded to the latest version.
  if (appVerion === LATEST_VERSION) {
    // Fetch the email of the user. In this sample we assume that the app is using Firebase Auth and
    // has set the Firebase Analytics User ID to be the same as the Firebase Auth uid using the
    // setUserId API.
    const user = await getAuth().getUser(uid);
    const email = user.email;
    const name = user.displayName;
    return sendSurveyEmail(email, name);
  }
  return null;
});

/**
 * Sends an email pointing to the Upgraded App survey.
 */
async function sendSurveyEmail(email, name) {
  const mailOptions = {
    from: 'MyCoolApp <onboarding@resend.dev>',
    to: email,
    subject: 'How did you like our new app?',
    text: `Hey ${name}, We've seen that you have upgraded to the new version of our app!
           It would be awesome if you could tell us how you like it.
           Fill out our survey: ${LINK_TO_SURVEY}`,
  };

  // Resend reports API failures in the returned `error` instead of throwing.
  const {error} = await resend.emails.send(mailOptions);
  if (error) {
    functions.logger.error('There was an error while sending the email:', error);
    return;
  }
  functions.logger.log('Upgrade App Survey email sent to:', email);
}
