import { json, env } from './_shared/http.js';
import { adminDb, orderAmountPaise } from './_shared/firebaseAdmin.js';
import { sendResend, ownerNotifyTo, ownerOrderHtml } from './_shared/notify.js';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const body = await req.json().catch(() => ({}));
  const orderId = String(body.orderId || '').trim();
  const method = body.paymentMethod === 'cod' ? 'cod' : 'razorpay';
  const keyId = env('RAZORPAY_KEY_ID');
  const secret = env('RAZORPAY_KEY_SECRET');

  if (!orderId) return json({ error: 'invalid_order' }, 400);
  if (method === 'cod') {
    const admin = await adminDb();
    if (admin) {
      const snap = await admin.db.collection('orders').doc(orderId).get();
      if (snap.exists) {
        const data = snap.data() || {};
        const order = { ...data, orderId: data.orderId || orderId };
        const sent = await sendResend({
          to: ownerNotifyTo(),
          subject: `New order ${order.orderId}`,
          html: ownerOrderHtml(order),
        });
        if (!sent?.ok) {
          console.error('owner order email failed', order.orderId, sent);
        }
      }
    }
    return json({ orderId, paymentMethod: 'cod', skipPayment: true });
  }
  if (!keyId || !secret) {
    return json({
      orderId,
      skipPayment: true,
      message: 'Razorpay keys are not set. Order is stored as pending until payment is configured.',
    });
  }

  const admin = await adminDb();
  if (!admin) return json({ error: 'not_configured', message: 'Server cannot verify order totals.' }, 501);
  const snap = await admin.db.collection('orders').doc(orderId).get();
  if (!snap.exists) return json({ error: 'order_not_found' }, 404);
  const data = snap.data() || {};
  if (data.paymentMethod === 'cod') {
    return json({ orderId, paymentMethod: 'cod', skipPayment: true });
  }
  if (data.paymentStatus === 'paid') return json({ error: 'already_paid' }, 409);

  const amountPaise = orderAmountPaise(data);
  if (amountPaise < 100) return json({ error: 'invalid_order' }, 400);

  if (data.razorpayOrderId) {
    return json({
      orderId,
      razorpayOrderId: data.razorpayOrderId,
      amount: amountPaise,
      currency: 'INR',
      keyId,
      reused: true,
    });
  }

  const auth = Buffer.from(`${keyId}:${secret}`).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt: orderId,
      notes: { orderId },
    }),
  });
  const rzp = await res.json().catch(() => ({}));
  if (!res.ok) {
    return json({ error: 'razorpay_create_failed', details: rzp }, 502);
  }
  return json({
    orderId,
    razorpayOrderId: rzp.id,
    amount: rzp.amount,
    currency: rzp.currency || 'INR',
    keyId,
  });
};

export const config = { path: '/api/create-order' };
