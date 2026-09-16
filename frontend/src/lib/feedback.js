import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { isValidEmail, stripHtml } from '@/lib/security';

const LS_AT = 'sk_feedback_at';
const COOLDOWN_MS = 2 * 60 * 1000;

function cooldownLeft() {
  try {
    const at = Number(sessionStorage.getItem(LS_AT) || 0);
    const left = at + COOLDOWN_MS - Date.now();
    return left > 0 ? left : 0;
  } catch {
    return 0;
  }
}

function markSubmitted() {
  try { sessionStorage.setItem(LS_AT, String(Date.now())); } catch {}
}

export function mapFeedbackDoc(id, data = {}) {
  const created = data.createdAt?.toDate?.() || (data.createdAtIso ? new Date(data.createdAtIso) : null);
  return {
    id,
    name: data.name || 'Guest',
    email: data.email || '',
    rating: Math.min(5, Math.max(1, Number(data.rating) || 5)),
    text: data.text || data.message || '',
    published: data.published === true,
    createdAt: created,
  };
}

export function subscribePublishedFeedback(onRows, onError) {
  if (!db) {
    onRows([]);
    return () => {};
  }
  const q = query(
    collection(db, 'feedback'),
    where('published', '==', true),
    orderBy('createdAt', 'desc'),
    limit(8),
  );
  return onSnapshot(
    q,
    (snap) => onRows(snap.docs.map((d) => mapFeedbackDoc(d.id, d.data()))),
    (err) => {
      onError?.(err);
      onRows([]);
    },
  );
}

export function subscribeAllFeedback(onRows, onError) {
  if (!db) {
    onRows([]);
    return () => {};
  }
  const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'), limit(200));
  return onSnapshot(
    q,
    (snap) => onRows(snap.docs.map((d) => mapFeedbackDoc(d.id, d.data()))),
    (err) => {
      onError?.(err);
      onRows([]);
    },
  );
}

export async function setFeedbackPublished(id, published) {
  if (!db || !id) throw new Error('Could not update this review.');
  await updateDoc(doc(db, 'feedback', id), {
    published: Boolean(published),
  });
}

export async function submitFeedback({ name, email, rating, text, company = '' }) {
  if (String(company || '').trim()) {
    return { ok: true, skipped: true };
  }
  const left = cooldownLeft();
  if (left > 0) {
    const err = new Error('Please wait a moment before sending another review.');
    err.code = 'cooldown';
    throw err;
  }
  const payload = {
    name: stripHtml(name, 80),
    email: String(email || '').trim().toLowerCase(),
    rating: Math.round(Number(rating)),
    text: stripHtml(text, 600),
    source: 'homepage',
  };
  if (payload.name.length < 2) {
    const err = new Error('Please enter your name.');
    err.code = 'invalid_name';
    throw err;
  }
  if (!payload.rating || payload.rating < 1 || payload.rating > 5) {
    const err = new Error('Please choose a star rating.');
    err.code = 'invalid_rating';
    throw err;
  }
  if (payload.text.length < 8) {
    const err = new Error('Please write a few words about your experience.');
    err.code = 'invalid_text';
    throw err;
  }
  if (payload.email && !isValidEmail(payload.email)) {
    const err = new Error('Please enter a valid email address.');
    err.code = 'invalid_email';
    throw err;
  }

  let apiOk = false;
  let stored = false;
  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, message: payload.text, company: '' }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.ok !== false) {
      apiOk = true;
      stored = Boolean(data?.id);
    } else if (!res.ok && data?.message) {
      const err = new Error(data.message);
      err.code = data.error || 'api';
      throw err;
    }
  } catch (err) {
    if (err?.code && err.code !== 'api') throw err;
  }

  if (!stored && db) {
    try {
      await addDoc(collection(db, 'feedback'), {
        ...payload,
        published: false,
        createdAt: serverTimestamp(),
        createdAtIso: new Date().toISOString(),
      });
      stored = true;
    } catch {}
  }

  if (!apiOk && !stored) {
    throw new Error('Could not send your feedback. Please try again.');
  }
  markSubmitted();
  return { ok: true, ...payload };
}
