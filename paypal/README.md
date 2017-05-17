# Accept paypal payment in functions firebase

Example use of Paypal-rest-sdk into functions firebase.
Can be improved.
# Demo
![](public/Demo.gif)

## Functions Code

See file [functions/index.js](functions/index.js) for the code.

The dependencies are listed in [functions/package.json](functions/package.json).

## Deploy and test

 - Enable billing on your project by switching to the Blaze or Flame plan. See [pricing](https://firebase.google.com/pricing/) for more details. This is required to be able to do requests to non-Google services.
  
  Create a REST API apps
  - [Add your Paypal API Secret Key](https://developer.paypal.com/developer/applications/)
  
  In
[functions/index.js](functions/index.js) 