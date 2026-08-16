import { json, env } from './_shared/http.js';
import { createHmac } from 'node:crypto';
import { confirmOrderPayment } from './_shared/firebaseAdmin.js';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const secret = env('RAZORPAY_KEY_SECRET');
  if (!secret) return json({ error: 'not_configured', message: 'RAZORPAY_KEY_SECRET is required to verify payments.' }, 501);
  const body = await req.json().catch(() => ({}));
  const orderId = body.razorpay_order_id;
  const paymentId = body.razorpay_payment_id;
  const signature = body.razorpay_signature;
  const storeOrderId = body.orderId;
  if (!orderId || !paymentId || !signature) return json({ error: 'missing_fields' }, 400);

  const expected = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  if (expected !== signature) return json({ error: 'invalid_signature' }, 400);

  const result = await confirmOrderPayment(storeOrderId || '', {
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
  });
  return json({
    ok: true,
    verified: true,
    firestoreUpdated: Boolean(result.updated),
  });
};

export const config = { path: '/api/verify-payment' };
