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

const functions = require('firebase-functions'),
      admin = require('firebase-admin'),
      logging = require('@google-cloud/logging')();

admin.initializeApp(functions.config().firebase);

const stripe = require('stripe')(functions.config().stripe.token),
      currency = functions.config().stripe.currency || 'USD';

// [START chargecustomer]
// Charge the Stripe customer whenever an amount is written to the Realtime database
exports.createStripeCharge = functions.database.ref('/users/{userId}/charges/{id}').onWrite(event => {
  const val = event.data.val();
  // This onWrite will trigger whenever anything is written to the path, so
  // noop if the charge was deleted, errored out, or the Stripe API returned a result (id exists) 
  if (val === null || val.id || val.error) return null;
  // Look up the Stripe customer id written in createStripeCustomer
  return admin.database().ref(`stripe_customers/${event.params.userId}/customer_id`).once('value').then(snapshot => {
    return snapshot.val();
  }).then(customer => {
    // Create a charge using the pushId as the idempotency key, protecting against double charges 
    const amount = val.amount;
    const idempotency_key = event.params.id;
    return stripe.charges.create({amount, currency, customer}, {idempotency_key});
  }).then(response => {
      // If the result is seccessful, write it back to the database
      return event.data.ref.set(response);
    }, error => {
      // We want to capture errors and render them in a user-friendly way, while
      // still logging an exception with Stackdriver
      return event.data.ref.child('error').set(userFacingMessage(error)).then(() => {
        return reportError(error, {user: event.params.userId});
      });
    }
  );
});
// [END chargecustomer]]

// When a user is created, register them with Stripe
exports.createStripeCustomer = functions.auth.user().onCreate(event => {
  const data = event.data;
  return stripe.customers.create({
    email: data.email,
  }).then(customer => {
    return admin.database().ref(`/stripe_customers/${data.uid}/customer_id`).set(customer.id);
  });
});

// Add a payment source (card) for a user by writing a stripe payment source token to Realtime database
exports.addPaymentSource = functions.database.ref('/stripe_customers/{userId}/cards/{pushId}/token').onWrite(event => {
  return admin.database().ref(`stripe_customers/${event.params.userId}/customer_id`).once('value').then(snapshot => {
    return snapshot.val();
  }).then(customer => {
    const source = event.data.val();
    const user = customer.val();
    return stripe.customers.createSource(
      user,
      {source}
   )}).then(response => {
      return event.data.ref.parent.set(response);
    }, error => {
      return event.data.ref.child('error').set(userFacingMessage(error)).then(() => {
      return reportError(error, {user: user});
    });
  });
});

// When a user deletes there account, clean up after them
exports.cleanupUser = functions.auth.user().onDelete(event => {
  return admin.database().ref(`/stripe_customers/${event.data.uid}`).once('value').then(snapshot => {
    return snapshot.val();
  }).then(customer => {
    return stripe.customers.del(customer);
  }).then(() => {
    return admin.database().ref(`/stripe_customers/${event.data.uid}`).remove();
  });
});

// To keep on top of errors, we should raise a verbose error report with Stackdriver rather
// than simply relying on console.error. This will calculate users affected + send you email
// alerts, if you've opted into receiving them.
// [START reporterror]
function reportError(err, context = {}) {
  // This is the name of the StackDriver log stream that will receive the log
  // entry. This name can be any valid log stream name, but must contain "err"
  // in order for the error to be picked up by StackDriver Error Reporting.
  const logName = 'errors';
  const log = logging.log(logName);

  // https://cloud.google.com/logging/docs/api/ref_v2beta1/rest/v2beta1/MonitoredResource
  const metadata = {
    resource: {
      type: 'cloud_function',
      labels: { function_name: process.env.FUNCTION_NAME }
    }
  };

  // https://cloud.google.com/error-reporting/reference/rest/v1beta1/ErrorEvent
  const errorEvent = {
    message: err.stack,
    serviceContext: {
      service: process.env.FUNCTION_NAME,
      resourceType: 'cloud_function'
    },
    context: context
  };

  // Write the error log entry
  return new Promise((resolve, reject) => {
    log.write(log.entry(metadata, errorEvent), error => {
      if (error) { reject(error); }
      resolve();
    });
  });
}
// [END reporterror]

// Sanitize the error message for the user
function userFacingMessage(error) {
  return error.type ? error.message : 'An error occurred, developers have been alerted';
}

