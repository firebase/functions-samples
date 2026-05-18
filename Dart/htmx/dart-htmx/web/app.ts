import htmx from 'htmx.org';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';

// Initialize Firebase with placeholder config for prod
const app = initializeApp({
  apiKey: 'demo-api-key',
  authDomain: 'demo-project.firebaseapp.com',
  projectId: 'demo-project',
});

const auth = getAuth(app);

// Connect to Auth Emulator if running locally
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  connectAuthEmulator(auth, 'http://' + window.location.hostname + ':9099');
}

let currentIdToken = '';

onIdTokenChanged(auth, async (user: User | null) => {
  currentIdToken = (await user?.getIdToken()) ?? '';
});

htmx.config.logAll = true;

// Configure HTMX to attach Authorization header (HTMX v4 context API)
// NOTE: This manual header injection could potentially be replaced with native browser cookies
// using `browserCookiePersistence` once it graduates from Beta/Public Preview.
htmx.on('htmx:config:request', (event: any) => {
  if (currentIdToken) {
    event.detail.ctx.request.headers['Authorization'] = 'Bearer ' + currentIdToken;
  }
});

// Expose clean global helpers on window for Locality of Behavior (LoB) inline event handlers
declare global {
  interface Window {
    firebaseSignIn: (email: string, pass: string, errorDivId: string) => Promise<void>;
    firebaseSignOut: () => Promise<void>;
  }
}

window.firebaseSignIn = async (email: string, pass: string, errorDivId: string) => {
  const errorDiv = document.getElementById(errorDivId) as HTMLDivElement;
  try {
    if (errorDiv) errorDiv.innerText = '';
    await signInWithEmailAndPassword(auth, email, pass);
    window.location.href = '?';
  } catch (error: any) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      try {
        // Automatically create the demo user in the emulator
        await createUserWithEmailAndPassword(auth, email, pass);
        window.location.href = '?';
      } catch (createError: any) {
        if (errorDiv) errorDiv.innerText = 'Error creating demo user: ' + createError.message;
      }
    } else {
      if (errorDiv) errorDiv.innerText = 'Sign in error: ' + error.message;
    }
  }
};

window.firebaseSignOut = async () => {
  await firebaseSignOut(auth);
  window.location.href = '?mode=signin';
};
