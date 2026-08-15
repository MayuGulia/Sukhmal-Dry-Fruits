import { json, notConfigured, env } from './_shared/http.js';
import { createHmac } from 'node:crypto';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const secret = env('RAZORPAY_KEY_SECRET');
  if (!secret) return notConfigured();
  const body = await req.json();
  const payload = `${body.razorpay_order_id}|${body.razorpay_payment_id}`;
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  if (expected !== body.razorpay_signature) return json({ error: 'invalid_signature' }, 400);
  return json({ ok: true, note: 'Idempotent order write + stock transaction run when Firestore Admin is configured.' });
};

export const config = { path: '/api/verify-payment' };
