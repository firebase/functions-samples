# Use LINE Login with Firebase

This sample shows how to Sign in Firebase using [LINE Login](https://developers.line.me/line-login/overview). In this sample we use LINE iOS and Android SDK to get LINE user information then create a Firebase Custom Token (using the Line user ID).

## Setup the sample

### LINE business account's creation and setup

 1. Follow the instruction in [LINE Developers document](https://developers.line.me/line-login/overview) to setup a LINE business account.
 1. After finished setting up your channel, follow the document to integrate LINE SDK in your [iOS](https://developers.line.me/ios/overview) and [Android](https://developers.line.me/android/overview) app. It should include:
  * Open **Technical Configuration** page of your LINE channel, and update the following values:
    * iOS Bundle ID: `com.google.firebase.LINELoginDemo`
    * Android Package Name: `com.google.firebase.linelogindemo`
    * Android Package Signature: The SHA1 value of your keystore, without semicolons
  * Download the LINE SDK for iOS and Android from LINE developers site and add them to your apps. The latest version of LINE SDK may have different API with that used to create the sample app, so you may need to make some changes to the sample apps. LINE SDK versions being used in building the sample apps are:
    *  iOS: **3.2.1**
    *  Android: **3.1.21** 
  * Update your Channel ID to your apps
    * iOS: Update `<your_channel_id>` in `LineAdapter.plist`
    * Android: Update `<your_channel_id>` in `app/build.gradle` 

### Firebase app creation and setup

 1. Create a Firebase project using the [Firebase Developer Console](https://console.firebase.google.com).
 1. **For the iOS app:** Go to **Firebase Console > Overview > Add Firebase to your iOS app** and create an app with the Bundle ID of `com.google.firebase.LINELoginDemo`. This will trigger your browser to download a `GoogleService-Info.plist` config file. Add this config file to your sample iOS app, then run `pod install` to make download necessary CocoaPods dependencies.
 1. **For the Android app:** Go to **Firebase Console > Overview > Add Firebase to your Android app** and create an app with the Package name of `com.google.firebase.linelogindemo`. This will trigger your browser to download a `google-services.json` config file. Add this config file to your sample Android app.
  * If you have problem creating a your Android app, try changing the Android app's package name to your own value (e.g. `com.yourdomain.linelogindemo`) and try again. Remember to update the package name inside your Android app and in your LINE Channel's **Technical Configuration** page as well.
 
Create and provide a Service Account's keys:
 1. Create a Service Accounts file as described in the [Server SDK setup instructions](https://firebase.google.com/docs/server/setup#add_firebase_to_your_app).
 1. Save the Service Account credential file as `service-account.json` and copy it to `functions/`. 
 (You should not check in this file to your repository as it contains secret key to grant full admin access to your Firebase account.)

## Run the sample

### Cloud Functions

Before running your iOS and Android sample app, you need to deploy your function to Firebase.

 1. Enable Billing on your Firebase the project by switching to the **Blaze** plan, this is currently needed to be able to perform HTTP requests to external services from a Cloud Function.
 1. Run `firebase use --add` and choose your Firebase project. This will configure the Firebase CLI to use the correct project locally.
 1. Copy the Channel ID of your LINE Business account and use them to set the `line.channelid` in Google Cloud environment variables. For this use:
 
 ```bash
 firebase functions:config:set line.channelid="<your_channel_id>"
 ```
 1. Run `firebase deploy ---only functions` to deploy the sample. The first time the Functions are deployed the process can take several minutes.

Then update your iOS and Android app with the domain name of your Cloud Functions. You can find it in the log of Firebase CLI after sucessfully deploying the function. It should look like `https://us-central1-<your Firebase project id>.cloudfunctions.net`
 * iOS: In `Constant.h`, replace the placeholder text with your domain.
 * Android: In `configs.xml`, replace the placeholder text with your domain.

### iOS, Android

Build the sample iOS and Android app and run them on your devices. Those sample apps should be working by now. If you see any compile errors or the apps crash when starting, please refer back to the setup instruction above and check if you missed anything.
