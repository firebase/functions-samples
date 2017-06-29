'use strict';
const functions = require('firebase-functions');
const paypal = require('paypal-rest-sdk');
// firebase-admin SDK init
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
// Configure your environment
paypal.configure({
    'mode': 'sandbox', // sandbox or live
    'client_id': functions.config().paypal.client_id,
    'client_secret': functions.config().paypal.client_secret
});

exports.pay = functions.https.onRequest((req, res) => {
    // Dev
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'application/json, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    // Build PayPal payment request
    const payReq = JSON.stringify({
        intent: 'sale',
        payer: {
            payment_method: 'paypal'
        },
        // example url https://us-central1-<project-id>.cloudfunctions.net/process
        // replace return_url, cancel_url
        redirect_urls: {
            return_url: `https://us-central1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/process`,
            cancel_url: 'http://localhost:4200/cancel'
        },
        transactions: [{
            amount: {
                total: req.body.price,
                currency: 'USD'
            },
            // This is the payment transaction description. Maximum length: 127
            description: 'Cloud Functions Firebase paypal-rest-sdk' // req.body.id
            // reference_id string .Optional. The merchant-provided ID for the purchase unit. Maximum length: 256.
            // reference_id: ''
        }]
    });
    // Initialize the payment and redirect the user
    paypal.payment.create(payReq, (error, payment) => {
        const links = {};
        if (error) {
            console.error(error);
            res.status('500').end();
        } else {
            // Capture HATEOAS links
            payment.links.forEach((linkObj) => {
                links[linkObj.rel] = {
                    href: linkObj.href,
                    method: linkObj.method
                };
            });
            // If redirect url present, redirect user
            if (links.hasOwnProperty('approval_url')) {
                // REDIRECT USER TO links['approval_url'].href
                console.log(links.approval_url.href);
                // res.set('Content-Type', 'application/json');
                res.redirect(links.approval_url.href);
            } else {
                console.error('no redirect URI present');
                res.status('500').end();
            }
        }
    });
});

// Complete the payment
exports.process = functions.https.onRequest((req, res) => {
    const paymentId = req.query.paymentId;
    const payerId = {
        payer_id: req.query.PayerID
    };

    paypal.payment.execute(paymentId, payerId, function (error, payment) {
        if (error) {
            console.error(error);
            res.redirect('http://localhost:4200/error');
        } else {
            if (payment.state === 'approved') {
                console.info('payment completed successfully');
                console.info('res.description: ', payment.transactions[0].description);
                // set paid status to True in RealTime Database
                const description = payment.transactions[0].description;
                const ref = admin.database().ref('paypal/');
                ref.push({
                    'paid': true,
                    'description': description,
                    'date': Date.now()
                }).then(r => console.info('promise: ', r));
                // replace url
                res.redirect('http://localhost:4200/success');
            } else {
                console.warn('payment.state: not approved ?');
                // replace debug url
                res.redirect(`https://console.firebase.google.com/project/${process.env.GCLOUD_PROJECT}/functions/logs?search=&severity=DEBUG`);
            }
        }
    });
});