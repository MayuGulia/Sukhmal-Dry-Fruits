import { json, notConfigured, env } from './_shared/http.js';
import { createHmac } from 'node:crypto';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const secret = env('RAZORPAY_WEBHOOK_SECRET');
  if (!secret) return notConfigured();
  const raw = await req.text();
  const sig = req.headers.get('x-razorpay-signature') || '';
  const expected = createHmac('sha256', secret).update(raw).digest('hex');
  if (expected !== sig) return json({ error: 'invalid_signature' }, 400);
  return json({ ok: true });
};

export const config = { path: '/api/webhooks/razorpay' };
