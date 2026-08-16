import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LS = 'sk_newsletter';

export function isValidEmail(email) {
  return EMAIL_RE.test(String(email || '').trim());
}

function rememberLocal(email) {
  try {
    const list = JSON.parse(localStorage.getItem(LS) || '[]');
    const already = list.includes(email);
    if (!already) {
      list.push(email);
      localStorage.setItem(LS, JSON.stringify(list));
    }
    return already;
  } catch {
    return false;
  }
}

export async function saveNewsletterSignup(rawEmail) {
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!isValidEmail(email)) {
    const err = new Error('Please enter a valid email address.');
    err.code = 'invalid_email';
    throw err;
  }

  let firestoreOk = false;
  if (db) {
    try {
      const id = email.replace(/[/#[\]]/g, '_');
      await setDoc(doc(db, 'newsletter', id), {
        email,
        createdAt: serverTimestamp(),
        source: 'footer',
      }, { merge: true });
      firestoreOk = true;
    } catch {}
  }

  try {
    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  } catch {}

  const already = rememberLocal(email);
  return { email, already, saved: firestoreOk || true };
}
