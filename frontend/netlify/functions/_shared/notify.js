import { env } from './http.js';

export async function sendResend({ to, subject, html }) {
  const key = env('RESEND_API_KEY');
  if (!key || !to) return { skipped: true, reason: 'missing_key_or_to' };
  const from = env('RESEND_FROM') || 'Sukhmal Dry Fruits <onboarding@resend.dev>';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: Array.isArray(to) ? to : [to], subject, html }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function addResendContact(email) {
  const key = env('RESEND_API_KEY');
  if (!key) return { skipped: true, reason: 'missing_key' };
  const admin = env('ADMIN_NOTIFY_EMAIL') || env('REACT_APP_ADMIN_EMAIL') || 'mayu.gulia156@gmail.com';
  const from = env('RESEND_FROM') || 'Sukhmal Dry Fruits <onboarding@resend.dev>';
  const send = async (to, subject, html) => fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  try {
    await send(
      admin,
      `Newsletter signup: ${email}`,
      `<p>${email} joined the Sukhmal mailing list.</p>`,
    );
  } catch {}
  try {
    await send(
      email,
      'You’re on the Sukhmal list',
      '<p>Thanks for subscribing to Sukhmal Dry Fruits. We’ll send festive launches and member-only offers here.</p>',
    );
  } catch {}
  return { ok: true, already: false };
}
