import { json } from './_shared/http.js';
import { addResendContact } from './_shared/notify.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return json({ error: 'invalid_email', message: 'Please enter a valid email address.' }, 400);
  try {
    const result = await addResendContact(email);
    return json({
      ok: true,
      already: Boolean(result.already),
      skipped: Boolean(result.skipped),
      message: result.already ? 'You’re already subscribed.' : 'You’re subscribed. Welcome to Sukhmal.',
    });
  } catch {
    return json({ ok: true, message: 'You’re subscribed. Welcome to Sukhmal.' });
  }
};

export const config = { path: '/api/subscribe' };
