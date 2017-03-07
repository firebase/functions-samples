const functions = require('firebase-functions'),
      admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

const stripe = require('stripe')(functions.config().stripe.token),
      currency = functions.config().stripe.currency || 'USD';

exports.createStripeCharge = functions.database.ref('/users/{userId}/charges/{id}').onWrite(event => {
  const val = event.data.val();
  if (val === null || val.id || val.error) return null;
  return admin.database().ref(`stripe_customers/${event.params.userId}`).once('value').then(snapshot => {
    return snapshot.val();
  }).then(customer => {
    const amount = val.amount;
    const idempotency_key = event.params.id;
    return stripe.charges.create({amount, currency, customer}, {idempotency_key});
  }).then(response => {
      return event.data.ref.set(response);
    }, error => {
      return event.data.ref.child('error').set(error.message);
    }
  );
});

exports.createStripeCustomer = functions.auth.user().onCreate(event => {
  const data = event.data;
  return stripe.customers.create({
    email: data.email,
  }).then(customer => {
    return admin.database().ref(`/stripe_customers/${data.uid}`).set(customer.id);
  });
});

exports.cleanupUser = functions.auth.user().onDelete(event => {
  return admin.database().ref(`/stripe_customers/${event.data.uid}`).once('value').then(snapshot => {
    return snapshot.val();
  }).then(customer => {
    return stripe.customers.del(customer);
  }).then(() => {
    return admin.database().ref(`/stripe_customers/${event.data.uid}`).remove();
  });
});
