var functions = require('firebase-functions');
var paypal = require('paypal-rest-sdk');
// firebase-admin SDK init
var admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
// Configure your environment
paypal.configure({
    'mode': 'sandbox', // sandbox or live
    'client_id': 'your_client_id', // replace your_client_id
    'client_secret': 'your_client_secret' // replace your_client_secret
});

exports.pay = functions.https.onRequest((req, res) => {
    // Dev
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'application/json, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST');

    // Build PayPal payment request
    var payReq = JSON.stringify({
        intent: 'sale',
        payer: {
            payment_method: 'paypal'
        },
        // exemple url https://us-central1-<project-id>.cloudfunctions.net/process
        // replace return_url, cancel_url
        redirect_urls: {
            return_url: 'https://us-central1-<project-id>.cloudfunctions.net/process',
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
    paypal.payment.create(payReq, function (error, payment) {
        var links = {};

        if (error) {
            console.error(JSON.stringify(error));
            res.end();
        } else {
            // Capture HATEOAS links
            payment.links.forEach(function (linkObj) {
                links[linkObj.rel] = {
                    href: linkObj.href,
                    method: linkObj.method
                };
            });

            // If redirect url present, redirect user
            if (links.hasOwnProperty('approval_url')) {
                // REDIRECT USER TO links['approval_url'].href
                // console.log(links['approval_url'])
                res.set('Content-Type', 'application/json');
                res.send({
                    approval_url: links.approval_url.href
                });
            } else {
                console.error('no redirect URI present');
            }
            res.status('500').end();
        }
    });
});

// Complete the payment
exports.process = functions.https.onRequest((req, res) => {
    var paymentId = req.query.paymentId;
    var payerId = {
        payer_id: req.query.PayerID
    };

    paypal.payment.execute(paymentId, payerId, function (error, payment) {
        if (error) {
            console.error(JSON.stringify(error));
            res.redirect('http://localhost:4200/error');
        } else {
            if (payment.state == 'approved') {
                console.info('payment completed successfully');
                console.info('res.description: ', payment.transactions[0].description);
                // set paid status to True in RealTime Database
                var description = payment.transactions[0].description;
                var ref = admin.database().ref('paypal/');
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
                res.redirect('https://console.firebase.google.com/project/<project-id>/functions/logs?search=&severity=DEBUG');
            }
        }
    });
});