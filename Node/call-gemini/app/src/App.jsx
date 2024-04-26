import { useState } from "react";
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import { initializeApp } from "firebase/app";
import "./App.css";

function App() {
  initializeApp({
    // Your Firebase app configs here
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
