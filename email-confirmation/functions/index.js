'use strict';
const functions = require('firebase-functions');
const axios = require('axios');
const nodemailer = require('nodemailer');
const Email = require('email-templates');
const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;
const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});
const email = new Email({
  transport: mailTransport,
  send: true,
  preview: false,
});

var admin = require('firebase-admin');

var serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://discount-bazaar-01-01-2021-default-rtdb.firebaseio.com'
});

const db=admin.firestore()

//Sends a Welcome Email on user creation
exports.sendWelcomeEmail=functions.firestore.document('users/{uid}').onCreate(async (user,context)=>{
  const val=user.data()
  const emailId=val.email
  const userName=val.displayName

  const mailchimpApiUrl = 'https://us6.api.mailchimp.com/3.0'
  const listID = '02cd4746c3'

  // creating the axios options parameter
  const options = {
		method: 'POST',
		url: `${mailchimpApiUrl}/lists/${listID}/members/`,
		headers: {
      'Content-type': 'application/json; charset=UTF-8',
    },
    auth: {
      username: 'discount_bazaar',
      password: '5f37819b63e01ec5357ec6387300ba1e-us6'
    },
    data: {
      email_address: emailId,
      status: 'subscribed',
      merge_fields: {
        'FNAME': userName,
      }
    }
  }
  return axios(options);
  

  // try {
  //   email.send({
  //     template: 'welcome',
  //     message:{
  //       from: '"Discount Bazaar" <noreply@discount-bazaar.com>',
  //       to: emailId,
  //     },
  //     locals:{
  //       displayName: userName
  //     }
  //     }).then(()=>functions.logger.info(
  //       `Welcome email sent to ${emailId} with displayname as ${userName} with userId as ${context.params.uid}`,
  //     ));
    
  // } catch (error) {
  //   functions.logger.error(
  //     'There was an error while sending the email:',
  //     error
  //   );
  // }
});

//Sends a Order Confirmation Email to user
exports.sendOrderPlaced=functions.firestore.document('users/{uid}/orders/{orderId}').onCreate(async (order,context)  =>{
  const uid=context.params.uid; 
  var userRef=await db.collection(`users`).doc(`${uid}`).get();
  var orderRef=db.collection(`users/${uid}/orders`);
  const emailId=userRef.data()['email'];
  const name=userRef.data()['displayName'];
  const token=userRef.data()['fcmToken'];
  var imageUrl=order.data().wooProducts.images[0].src;
  const listoforders=await orderRef.where('emailSent','==',false).get();
  var receipt_details=[];
  if(listoforders.empty){
    functions.logger.info(
      'Emails are already Sent'
    );
    return;
  }else{
    var total=0;
    listoforders.forEach((doc)=>{
      const data=doc.data();
      var name=data.wooProducts['name'];
      var quantity=data.totalQuantity;
      var price = data.wooProducts.salesPrice;
      receipt_details.push(
        {
          Description:`${name} x ${quantity}`,
          Amount:`₹ ${price}`
        }
      );
      total+=parseFloat(price)
    })
    var date = new Date();
    var dateString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000 ))
                    .toISOString()
                  .split("T")[0];
    const messgingPromise=admin.messaging().send({
      token:token,
      notification:{
        imageUrl:imageUrl,
        title:'Order placed',
        body:`${name} your order containing ${receipt_details[0].Description} has been placed successfully`,

      },
      data:{
        title:'Order placed',
        body:`${name} your order #${order.data()['time']} has been placed successfully`,
        orderId:`${order.data()['time']}`,
        type:'order_placed',
        total:`${total}`,
        purchase_date:`${dateString}`,
        route:'/order',
        imageUrl:`${imageUrl}`,
      },
      android: {
        priority: "high",
      },
    })
    const emailPromise=email.send({
      template: 'orderplaced',
      message:{
        from: '"Discount Bazaar" <noreply@discount-bazaar.com>',
        to: emailId,
      },
      locals:{
        name: name,
        receipt_details: receipt_details,
        total:`₹ ${total}`,
        purchase_date:dateString,
      }
      });

      await Promise.all([messgingPromise,emailPromise])
      .then((d)=>{
        listoforders.forEach((doc)=>{
          orderRef.doc(doc.id).update({'emailSent':true});
        });
        functions.logger.info('Sent email and notifications successfully')})
      .catch((error)=>functions.logger.error(`error occeurred: ${error.message}`));
}
});

