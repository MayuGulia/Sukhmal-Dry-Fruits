import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, FIREBASE_ENABLED } from '@/lib/firebase';
import { isStrongPassword, passwordPolicyMessage, stripHtml, toE164IndianPhone } from '@/lib/security';
import { ADMIN_EMAIL, isAdminEmail } from '@/lib/adminEmails';
import { setAuthToken } from '@/lib/api';
import {
  googleSignInPrefersRedirect,
  shouldFallbackGoogleRedirect,
  storeGoogleAuthError,
} from '@/lib/authRedirect';

const Ctx = createContext(null);
const LS = 'sk_auth_v1';
export { ADMIN_EMAIL, isAdminEmail };

const RECAPTCHA_ID = 'sk-recaptcha';
let recaptchaVerifier = null;
let phoneConfirmation = null;

function resetPhoneRecaptcha() {
  try { recaptchaVerifier?.clear(); } catch {}
  recaptchaVerifier = null;
}

function ensurePhoneRecaptcha() {
  if (!auth) throw new Error('Firebase is not configured');
  if (typeof document === 'undefined' || !document.getElementById(RECAPTCHA_ID)) {
    throw new Error('Phone verification is still loading. Try again in a moment.');
  }
  resetPhoneRecaptcha();
  recaptchaVerifier = new RecaptchaVerifier(auth, RECAPTCHA_ID, { size: 'invisible' });
  return recaptchaVerifier;
}

export const DEMO_ADMIN = {
  email: ADMIN_EMAIL,
  password: '',
  name: 'Admin',
};

export function loginLocation(returnTo = '/') {
  const path = typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')
    ? returnTo
    : '/';
  return { pathname: '/login', search: `?return=${encodeURIComponent(path)}`, state: { from: path, returnTo: path } };
}

export function isDemoAdminCredentials() {
  return false;
}

function collectEmails(source) {
  if (!source) return [];
  const emails = [source.email, ...(source.providerData || []).map((p) => p.email)];
  return emails.filter(Boolean);
}

function mapSession(fbUser, claims = {}) {
  const admin = Boolean(claims.admin) || collectEmails(fbUser).some(isAdminEmail);
  return {
    uid: fbUser.uid,
    email: fbUser.email || collectEmails(fbUser)[0] || null,
    phone: fbUser.phoneNumber || null,
    displayName: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Guest'),
    photoURL: fbUser.photoURL || null,
    emailVerified: Boolean(fbUser.emailVerified),
    customClaims: admin ? { admin: true } : {},
  };
}

async function sessionFromFirebaseUser(fbUser) {
  let claims = {};
  try {
    const tokenResult = await fbUser.getIdTokenResult();
    claims = tokenResult.claims || {};
    setAuthToken(tokenResult.token);
  } catch {
    try {
      setAuthToken(await fbUser.getIdToken());
    } catch {
      setAuthToken(null);
    }
  }
  const session = mapSession(fbUser, claims);
  try {
    localStorage.setItem(LS, JSON.stringify(session));
  } catch {}
  return session;
}

async function upsertUserDoc(fbUser, extras = {}) {
  if (!db || !fbUser?.uid) return;
  const ref = doc(db, 'users', fbUser.uid);
  const profile = {
    name: stripHtml(extras.name || fbUser.displayName || '', 80),
    email: fbUser.email || collectEmails(fbUser)[0] || extras.email || null,
    phone: extras.phone || fbUser.phoneNumber || null,
    photoURL: fbUser.photoURL || null,
    updatedAt: serverTimestamp(),
  };
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await setDoc(ref, profile, { merge: true });
      return;
    }
    await setDoc(ref, {
      ...profile,
      addresses: [],
      wishlist: [],
      loyaltyPoints: 0,
      role: 'customer',
      createdAt: serverTimestamp(),
    }, { merge: true });
  } catch {
    try {
      await setDoc(ref, profile, { merge: true });
    } catch (err) {
      console.warn('[Sukhmal Auth] user profile save skipped', err?.code || err?.message);
    }
  }
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

    let cancelled = false;
    const failSafe = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 4000);

    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) await upsertUserDoc(result.user);
      })
      .catch((err) => {
        storeGoogleAuthError(err);
      });

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (cancelled) return;
      if (!fbUser) {
        try { localStorage.removeItem(LS); } catch {}
        setAuthToken(null);
        setUser(null);
        setLoading(false);
        return;
      }
      const session = await sessionFromFirebaseUser(fbUser);
      if (cancelled) return;
      setUser(session);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      clearTimeout(failSafe);
      unsub();
    };
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
    if (!isAdminEmail(email) && !isStrongPassword(password)) throw new Error(passwordPolicyMessage());
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (name) await updateProfile(cred.user, { displayName: stripHtml(name, 80) });
    await upsertUserDoc(cred.user, { name, phone });
    try { await sendEmailVerification(cred.user); } catch {}
    const session = await sessionFromFirebaseUser(cred.user);
    if (name) session.displayName = stripHtml(name, 80);
    if (phone) session.phone = phone;
    setUser(session);
    return session;
  };

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) throw new Error('Firebase is not configured');
    const useRedirect = googleSignInPrefersRedirect();
    if (useRedirect) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await upsertUserDoc(cred.user);
      const session = await sessionFromFirebaseUser(cred.user);
      setUser(session);
      return session;
    } catch (err) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        throw err;
      }
      if (shouldFallbackGoogleRedirect(err)) {
        await signInWithRedirect(auth, googleProvider);
        return null;
      }
      throw err;
    }
  };

  const sendReset = async (email) => {
    if (!auth) throw new Error('Firebase is not configured');
    await sendPasswordResetEmail(auth, email.trim());
  };

  const startPhoneSignIn = async (phone) => {
    if (!auth) throw new Error('Firebase is not configured');
    const e164 = toE164IndianPhone(phone);
    if (!e164) throw new Error('Please enter a valid 10-digit Indian mobile number.');
    const verifier = ensurePhoneRecaptcha();
    try {
      phoneConfirmation = await signInWithPhoneNumber(auth, e164, verifier);
      return e164;
    } catch (err) {
      resetPhoneRecaptcha();
      throw err;
    }
  };

  const confirmPhoneOtp = async (code, extras = {}) => {
    if (!auth) throw new Error('Firebase is not configured');
    if (!phoneConfirmation) throw new Error('Request a new code first.');
    const cred = await phoneConfirmation.confirm(String(code || '').trim());
    phoneConfirmation = null;
    if (extras.name) {
      try { await updateProfile(cred.user, { displayName: stripHtml(extras.name, 80) }); } catch {}
    }
    await upsertUserDoc(cred.user, { name: extras.name, phone: cred.user.phoneNumber });
    const session = await sessionFromFirebaseUser(cred.user);
    if (extras.name) session.displayName = stripHtml(extras.name, 80);
    setUser(session);
    return session;
  };

  const refreshSession = async () => {
    if (!auth?.currentUser) return user;
    try { await auth.currentUser.reload(); } catch {}
    const session = await sessionFromFirebaseUser(auth.currentUser);
    setUser(session);
    return session;
  };

  const logout = async () => {
    try { if (auth) await signOut(auth); } catch {}
    try { localStorage.removeItem(LS); } catch {}
    try { sessionStorage.removeItem('sk_login_lock'); } catch {}
    phoneConfirmation = null;
    resetPhoneRecaptcha();
    setAuthToken(null);
    setUser(null);
  };

  const isAdmin = Boolean(user?.customClaims?.admin) || isAdminEmail(user?.email);

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
        startPhoneSignIn,
        confirmPhoneOtp,
        sendReset,
        refreshSession,
        firebaseEnabled: FIREBASE_ENABLED,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
