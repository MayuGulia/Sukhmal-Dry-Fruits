import { json, notConfigured, env } from './_shared/http.js';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (!env('RAZORPAY_KEY_SECRET') && !env('FIREBASE_ADMIN_PRIVATE_KEY')) return notConfigured();
  const body = await req.json();
  return json({
    message: 'Server recalculates totals from Firestore product prices, then creates a Razorpay order. Client-sent prices are ignored.',
    receivedItems: Array.isArray(body.items) ? body.items.length : 0,
  }, 501);
};

export const config = { path: '/api/create-order' };
