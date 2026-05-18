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

// Configure HTMX to attach Authorization header
// NOTE: This manual header injection could potentially be replaced with native browser cookies
// using `browserCookiePersistence` once it graduates from Beta/Public Preview.
htmx.on('htmx:config:request', (event: any) => {
  if (currentIdToken) {
    event.detail.headers['Authorization'] = 'Bearer ' + currentIdToken;
  }
});

// Sign In Logic via HTMX Event
htmx.on('#signin-form', 'htmx:confirm', async (event: any) => {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const formData = new FormData(form);
  const email = formData.get('email') as string;
  const pass = formData.get('password') as string;
  const errorDiv = document.getElementById('login-error') as HTMLDivElement;

  try {
    errorDiv.innerText = '';
    await signInWithEmailAndPassword(auth, email, pass);
    window.location.href = '?';
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      try {
        // Automatically create the demo user in the emulator
        await createUserWithEmailAndPassword(auth, email, pass);
        window.location.href = '?';
      } catch (createError: any) {
        errorDiv.innerText = 'Error creating demo user: ' + createError.message;
      }
    } else {
      errorDiv.innerText = 'Sign in error: ' + error.message;
    }
  }
});

// Sign Out Logic via HTMX Event
htmx.on('#signout-button', 'htmx:confirm', async (event: any) => {
  event.preventDefault();
  await firebaseSignOut(auth);
  window.location.href = '?mode=signin';
});
