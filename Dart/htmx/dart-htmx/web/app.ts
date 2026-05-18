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
    event.detail.ctx.request.headers['Authorization'] = 'Bearer ' + currentIdToken;
  }
});

// Intercept Sign In Form Submission (Native Event Delegation)
document.addEventListener('submit', async (event: Event) => {
  const target = event.target as HTMLElement;

  if (target.id === 'signin-form') {
    event.preventDefault(); // Halt native browser form submission and page reload
    const formData = new FormData(target as HTMLFormElement);
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
  }
});

// Intercept Sign Out Button Click (Native Event Delegation)
document.addEventListener('click', async (event: Event) => {
  const target = event.target as HTMLElement;

  if (target.id === 'signout-button') {
    event.preventDefault(); // Prevent HTMX Ajax request from firing
    await firebaseSignOut(auth);
    window.location.href = '?mode=signin';
  }
});
