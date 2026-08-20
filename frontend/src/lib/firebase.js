import { initializeApp, getApps } from 'firebase/app';
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyCvhXEY31pqU0vTo3yFuRDn8XWxdC3VUBA',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'sukhmal.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'sukhmal',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'sukhmal.firebasestorage.app',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '250228339386',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:250228339386:web:8d853ae969e6eeb5a5c883',
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || 'G-DKV7R2C0S6',
};

export const FIREBASE_ENABLED = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export const app = FIREBASE_ENABLED
  ? (getApps()[0] || initializeApp(firebaseConfig))
  : null;

function createAuth(firebaseApp) {
  try {
    return initializeAuth(firebaseApp, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    return getAuth(firebaseApp);
  }
}

export const auth = app ? createAuth(app) : null;
export const db = app ? getFirestore(app, 'default') : null;
export const storage = app ? getStorage(app) : null;
export const functions = app ? getFunctions(app, 'asia-south1') : null;
export const googleProvider = app ? new GoogleAuthProvider() : null;
if (googleProvider) {
  googleProvider.addScope('email');
  googleProvider.addScope('profile');
  googleProvider.setCustomParameters({ prompt: 'select_account' });
}
