import { json, env } from './_shared/http.js';
import { adminDb, orderAmountPaise } from './_shared/firebaseAdmin.js';
import { notifyCustomerOfOrder, notifyOwnerOfOrder } from './_shared/notify.js';

function orderFromBody(body, orderId) {
  const raw = body.order && typeof body.order === 'object' ? body.order : body;
  return {
    orderId: raw.orderId || orderId,
    customer: raw.customer || {},
    shippingAddress: raw.shippingAddress || null,
    items: Array.isArray(raw.items) ? raw.items : [],
    totals: raw.totals || {},
    total: raw.total ?? raw.totals?.total ?? 0,
    paymentMethod: raw.paymentMethod || 'cod',
    eta: raw.eta || '',
  };
}

async function loadCodOrder(orderId, body) {
  const admin = await adminDb();
  if (admin) {
    try {
      const snap = await admin.db.collection('orders').doc(orderId).get();
      if (snap.exists) {
        const data = snap.data() || {};
        return { ...data, orderId: data.orderId || orderId };
      }
    } catch (err) {
      console.error('cod order firestore read failed', orderId, err?.message);
    }
  }
  return orderFromBody(body, orderId);
}

async function notifyCodOrder(order) {
  const owner = await notifyOwnerOfOrder(order);
  const customer = await notifyCustomerOfOrder(order);
  return {
    ownerNotified: Boolean(owner?.ok),
    customerNotified: Boolean(customer?.ok),
    ownerNotify: { ok: owner?.ok || false, status: owner?.status || null, id: owner?.id || null, skipped: owner?.skipped || false, reason: owner?.reason || owner?.data?.message || null },
    customerNotify: { ok: customer?.ok || false, status: customer?.status || null, id: customer?.id || null, skipped: customer?.skipped || false, reason: customer?.reason || customer?.data?.message || null },
  };
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const body = await req.json().catch(() => ({}));
  const orderId = String(body.orderId || '').trim();
  const method = body.paymentMethod === 'cod' ? 'cod' : 'razorpay';
  const keyId = env('RAZORPAY_KEY_ID');
  const secret = env('RAZORPAY_KEY_SECRET');

  if (!orderId) return json({ error: 'invalid_order' }, 400);
  if (method === 'cod') {
    const order = await loadCodOrder(orderId, body);
    const notify = await notifyCodOrder(order);
    return json({ orderId, paymentMethod: 'cod', skipPayment: true, ...notify });
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
    const notify = await notifyCodOrder({ ...data, orderId: data.orderId || orderId });
    return json({ orderId, paymentMethod: 'cod', skipPayment: true, ...notify });
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
