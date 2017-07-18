'use strict';
const functions = require('firebase-functions');
// CORS Express middleware to enable CORS Requests.
const cors = require('cors')({origin: true});
const paypal = require('paypal-rest-sdk');
// firebase-admin SDK init
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
// Configure your environment
paypal.configure({
    'mode': 'sandbox', // sandbox or live
    'client_id': functions.config().paypal.client_id, // run: firebase functions:config:set paypal.client_id="yourPaypalClientID" 
    'client_secret': functions.config().paypal.client_secret // run: firebase functions:config:set paypal.client_secret="yourPaypalClientSecret"
});

exports.pay = functions.https.onRequest((req, res) => {
    // Dev
    cors(req, res, () => {});
    // 1.Set up a payment information object, Nuild PayPal payment request
    const payReq = JSON.stringify({
        intent: 'sale',
        payer: {
            payment_method: 'paypal'
        },
        // example url https://us-central1-<project-id>.cloudfunctions.net/process
        // replace return_url, cancel_url
        redirect_urls: {
            return_url: `https://us-central1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/process`, // 
            cancel_url: 'http://localhost:5000/cancel' // replace with your app url
        },
        transactions: [{
            amount: {
                total: req.body.price,
                currency: 'USD'
            },
            // This is the payment transaction description. Maximum length: 127
            description: req.body.uid, // req.body.id
            // reference_id string .Optional. The merchant-provided ID for the purchase unit. Maximum length: 256.
            // reference_id: req.body.uid,
            custom: req.body.uid,
            // soft_descriptor: req.body.uid
            // "invoice_number": req.body.uid,A
        }]
    });
    // 2.Initialize the payment and redirect the user.
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
                console.info(links.approval_url.href);
                // res.json({"approval_url":links.approval_url.href});
                res.redirect(302, links.approval_url.href);
            } else {
                console.error('no redirect URI present');
                res.status('500').end();
            }
        }
    });
});

// 3.Complete the payment. Use the payer and payment IDs provided in the query string following the redirect.
exports.process = functions.https.onRequest((req, res) => {
    const paymentId = req.query.paymentId;
    const payerId = {
        payer_id: req.query.PayerID
    };
    paypal.payment.execute(paymentId, payerId, function (error, payment) {
        if (error) {
            console.error(error);
            res.redirect('http://localhost:5000/error'); // replace with your url page error
        } else {
            if (payment.state === 'approved') {
                console.info('payment completed successfully, description: ', payment.transactions[0].description);
                // console.info('req.custom: : ', payment.transactions[0].custom);
                // set paid status to True in RealTime Database
                const date = Date.now();
                const uid = payment.transactions[0].description;
                const ref = admin.database().ref('users/' + uid + '/');
                ref.push({
                    'paid': true,
                    // 'description': description,
                    'date': date
                }).then(r => console.info('promise: ', r));
                res.redirect('http://localhost:5000/success'); // replace with your url, page success
            } else {
                console.warn('payment.state: not approved ?');
                // replace debug url
                res.redirect(`https://console.firebase.google.com/project/${process.env.GCLOUD_PROJECT}/functions/logs?search=&severity=DEBUG`);
            }
        }
    });
});