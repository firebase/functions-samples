import { useState } from "react";
import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
} from "firebase/functions";
import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import "./App.css";

function App() {
  const app = initializeApp({
    // Your Firebase app configs here
    apiKey: "AIzaSyBk-u6F9UAesAwj7NQh80Rlr-AHc69UtOY",
    authDomain: "rc-strawberry.firebaseapp.com",
    projectId: "rc-strawberry",
    storageBucket: "rc-strawberry.appspot.com",
    messagingSenderId: "105225960024",
    appId: "1:105225960024:web:a2c70ff84e835a7d22682d",
  });

  // Set up App Check according to https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider
  if (process.env.NODE_ENV !== "production") {
    // Local testing 
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  const APP_CHECK_TOKEN = "APP_CHECK_TOKEN";
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(APP_CHECK_TOKEN),
    isTokenAutoRefreshEnabled: true,
  });

  const functions = getFunctions();
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  const callGemini = httpsCallable(functions, "callGemini");
  const [geminiResponse, setGeminiResponse] = useState();

  return (
    <>
      <div>
        <button
          onClick={() =>
            callGemini().then((result) => {
              const data = result.data;
              setGeminiResponse(data);
            })
          }
        >
          Call Gemini
        </button>
        <p>{JSON.stringify(geminiResponse?.text)}</p>
      </div>
    </>
  );
}

export default App;
