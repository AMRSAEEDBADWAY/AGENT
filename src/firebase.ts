/**
 * 🔥 Firebase Configuration — BaseerFlow
 * ========================================
 * Initializes Firebase for Google Authentication.
 * 
 * Setup:
 *   1. Go to Firebase Console → Project Settings → General
 *   2. Under "Your apps", click "Add app" → Web
 *   3. Copy the config values into web/frontend/.env
 *   4. Enable Google Auth in Firebase Console → Authentication → Sign-in method
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
// Force account chooser popup every time (important for shared devices)
googleProvider.setCustomParameters({ prompt: 'select_account' });
