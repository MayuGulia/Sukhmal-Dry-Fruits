import { json, env } from './_shared/http.js';
import { createHmac } from 'node:crypto';
import { confirmOrderPayment } from './_shared/firebaseAdmin.js';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const secret = env('RAZORPAY_WEBHOOK_SECRET');
  if (!secret) return json({ error: 'not_configured', message: 'RAZORPAY_WEBHOOK_SECRET is required.' }, 501);
  const raw = await req.text();
  const sig = req.headers.get('x-razorpay-signature') || '';
  const expected = createHmac('sha256', secret).update(raw).digest('hex');
  if (expected !== sig) return json({ error: 'invalid_signature' }, 400);

  let event = {};
  try { event = JSON.parse(raw); } catch { return json({ error: 'invalid_json' }, 400); }

  if (event.event === 'payment.captured') {
    const entity = event.payload?.payment?.entity || {};
    const orderId = entity.notes?.orderId || entity.notes?.receipt;
    if (orderId) {
      await confirmOrderPayment(orderId, {
        razorpayPaymentId: entity.id || null,
        razorpayOrderId: entity.order_id || null,
      });
    }
  }
  return json({ ok: true });
};

export const config = { path: '/api/webhooks/razorpay' };
