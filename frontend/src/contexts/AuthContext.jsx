import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, FIREBASE_ENABLED } from '@/lib/firebase';

const Ctx = createContext(null);
const LS = 'sk_auth_v1';
export const ADMIN_EMAIL = (process.env.REACT_APP_ADMIN_EMAIL || 'monikabatra890@gmail.com').toLowerCase();

export const DEMO_ADMIN = {
  email: ADMIN_EMAIL,
  password: '',
  name: 'Monika',
};

export function loginLocation(returnTo = '/') {
  const path = typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')
    ? returnTo
    : '/';
  return { pathname: '/login', search: `?return=${encodeURIComponent(path)}`, state: { from: path, returnTo: path } };
}

export function isAdminEmail(email) {
  return String(email || '').trim().toLowerCase() === ADMIN_EMAIL;
}

export function isDemoAdminCredentials() {
  return false;
}

function mapSession(fbUser, claims = {}) {
  const admin = Boolean(claims.admin) || isAdminEmail(fbUser.email);
  return {
    uid: fbUser.uid,
    email: fbUser.email || null,
    phone: fbUser.phoneNumber || null,
    displayName: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Guest'),
    emailVerified: Boolean(fbUser.emailVerified),
    customClaims: admin ? { admin: true } : {},
  };
}

async function sessionFromFirebaseUser(fbUser) {
  let claims = {};
  try {
    const token = await fbUser.getIdTokenResult(true);
    claims = token.claims || {};
  } catch {}
  const session = mapSession(fbUser, claims);
  try {
    localStorage.setItem(LS, JSON.stringify(session));
  } catch {}
  return session;
}

async function upsertUserDoc(fbUser, extras = {}) {
  if (!db || !fbUser?.uid) return;
  const ref = doc(db, 'users', fbUser.uid);
  let exists = false;
  try {
    exists = (await getDoc(ref)).exists();
  } catch {}
  const payload = {
    name: extras.name || fbUser.displayName || '',
    email: fbUser.email || null,
    phone: extras.phone || fbUser.phoneNumber || null,
    updatedAt: serverTimestamp(),
  };
  if (!exists) {
    payload.addresses = [];
    payload.wishlist = [];
    payload.loyaltyPoints = 0;
    payload.createdAt = serverTimestamp();
  }
  await setDoc(ref, payload, { merge: true });
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!FIREBASE_ENABLED || !auth) {
      try {
        const raw = localStorage.getItem(LS);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (isAdminEmail(parsed.email) && !parsed.customClaims?.admin) {
            parsed.customClaims = { admin: true };
          }
          setUser(parsed);
        }
      } catch {}
      setLoading(false);
      return undefined;
    }

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        try { localStorage.removeItem(LS); } catch {}
        setUser(null);
        setLoading(false);
        return;
      }
      const session = await sessionFromFirebaseUser(fbUser);
      setUser(session);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = ({ email, phone, name } = {}) => {
    if (FIREBASE_ENABLED) {
      throw new Error('Use email, password, or Google to sign in');
    }
    const admin = isAdminEmail(email);
    const u = {
      uid: 'usr_' + Math.random().toString(36).slice(2, 10),
      email: email || null,
      phone: phone || null,
      displayName: name || (email ? email.split('@')[0] : 'Guest'),
      emailVerified: false,
      customClaims: admin ? { admin: true } : {},
    };
    localStorage.setItem(LS, JSON.stringify(u));
    setUser(u);
    return u;
  };

  const signInWithEmail = async (email, password) => {
    if (!auth) throw new Error('Firebase is not configured');
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    await upsertUserDoc(cred.user);
    const session = await sessionFromFirebaseUser(cred.user);
    setUser(session);
    return session;
  };

  const signUpWithEmail = async ({ email, password, name, phone } = {}) => {
    if (!auth) throw new Error('Firebase is not configured');
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (name) await updateProfile(cred.user, { displayName: name });
    await upsertUserDoc(cred.user, { name, phone });
    const session = await sessionFromFirebaseUser(cred.user);
    if (name) session.displayName = name;
    if (phone) session.phone = phone;
    setUser(session);
    return session;
  };

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) throw new Error('Firebase is not configured');
    const cred = await signInWithPopup(auth, googleProvider);
    await upsertUserDoc(cred.user);
    const session = await sessionFromFirebaseUser(cred.user);
    setUser(session);
    return session;
  };

  const sendReset = async (email) => {
    if (!auth) throw new Error('Firebase is not configured');
    await sendPasswordResetEmail(auth, email.trim());
  };

  const logout = async () => {
    try { if (auth) await signOut(auth); } catch {}
    localStorage.removeItem(LS);
    setUser(null);
  };

  const isAdmin = Boolean(user?.customClaims?.admin);

  return (
    <Ctx.Provider
      value={{
        user,
        isAuthed: !!user,
        isAdmin,
        login,
        logout,
        loading,
        loginLocation,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        sendReset,
        firebaseEnabled: FIREBASE_ENABLED,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
