import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyA8869V39QQkcIvrYcD40_c14NumVZJcLo',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'sukhmal-website.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'sukhmal-website',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'sukhmal-website.firebasestorage.app',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '1035357939609',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:1035357939609:web:6eaa71a0cda3479a0b1508',
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || 'G-9J8GX6MNN4',
};

export const FIREBASE_ENABLED = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export const app = FIREBASE_ENABLED
  ? (getApps()[0] || initializeApp(firebaseConfig))
  : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
export const googleProvider = app ? new GoogleAuthProvider() : null;
if (googleProvider) {
  googleProvider.setCustomParameters({ prompt: 'select_account' });
}
