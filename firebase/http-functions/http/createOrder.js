const { json, readJsonBody, httpsFn, RAZORPAY_SECRETS, RESEND_SECRETS, WHATSAPP_SECRETS } = require('../_shared/httpFn');
const { envGet } = require('../_shared/env');
const { adminDb, orderAmountPaise, claimCodOrderEmails, markOrderEmailsSent } = require('../_shared/firebaseAdmin');
const { notifyOrderPlaced } = require('../_shared/notify');
const { notifyOwnerWhatsapp } = require('../_shared/notifyOwnerWhatsapp');

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
    email: raw.email || raw.customer?.email || '',
  };
}

async function loadOrder(orderId, body) {
  const fallback = orderFromBody(body, orderId);
  const admin = await adminDb();
  if (admin) {
    try {
      const snap = await admin.db.collection('orders').doc(orderId).get();
      if (snap.exists) {
        const data = snap.data() || {};
        return {
          ...fallback,
          ...data,
          orderId: data.orderId || orderId,
          customer: { ...fallback.customer, ...(data.customer || {}) },
        };
      }
    } catch (err) {
      console.error('order firestore read failed', orderId, err?.message);
    }
  }
  return fallback;
}

async function notifyConfirmedOrder(order) {
  const claim = await claimCodOrderEmails(order);
  if (!claim.claimed) {
    return {
      ownerNotified: false,
      customerNotified: false,
      skipped: true,
      reason: 'already_emailed',
    };
  }
  const notify = await notifyOrderPlaced(claim.order);
  await markOrderEmailsSent(claim.order.orderId, notify);
  try {
    await notifyOwnerWhatsapp(claim.order);
  } catch (err) {
    console.error('owner whatsapp ignored', claim.order.orderId, err?.message);
  }
  return notify;
}

const createOrder = httpsFn(async (req, res) => {
  if (req.method !== 'POST') return json(res, { error: 'method' }, 405);
  const body = readJsonBody(req);
  const orderId = String(body.orderId || '').trim();
  const method = body.paymentMethod === 'cod' ? 'cod' : 'razorpay';
  const keyId = envGet('RAZORPAY_KEY_ID');
  const secret = envGet('RAZORPAY_KEY_SECRET');

  if (!orderId) return json(res, { error: 'invalid_order' }, 400);
  if (method === 'cod') {
    const order = await loadOrder(orderId, body);
    const notify = await notifyConfirmedOrder(order);
    return json(res, { orderId, paymentMethod: 'cod', skipPayment: true, ...notify });
  }
  if (!keyId || !secret) {
    return json(res, {
      orderId,
      skipPayment: true,
      message: 'Razorpay keys are not set. Order is stored as pending until payment is configured.',
    });
  }

  const admin = await adminDb();
  if (!admin) return json(res, { error: 'not_configured', message: 'Server cannot verify order totals.' }, 501);
  const snap = await admin.db.collection('orders').doc(orderId).get();
  if (!snap.exists) return json(res, { error: 'order_not_found' }, 404);
  const data = snap.data() || {};
  if (data.paymentMethod === 'cod') {
    const notify = await notifyConfirmedOrder({ ...data, orderId: data.orderId || orderId });
    return json(res, { orderId, paymentMethod: 'cod', skipPayment: true, ...notify });
  }
  if (data.paymentStatus === 'paid') return json(res, { error: 'already_paid' }, 409);

  const amountPaise = orderAmountPaise(data);
  if (amountPaise < 100) return json(res, { error: 'invalid_order' }, 400);

  if (data.razorpayOrderId) {
    return json(res, {
      orderId,
      razorpayOrderId: data.razorpayOrderId,
      amount: amountPaise,
      currency: 'INR',
      keyId,
      reused: true,
    });
  }

  const auth = Buffer.from(`${keyId}:${secret}`).toString('base64');
  const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt: orderId,
      notes: { orderId },
    }),
  });
  const rzp = await rzpRes.json().catch(() => ({}));
  if (!rzpRes.ok) {
    return json(res, { error: 'razorpay_create_failed', details: rzp }, 502);
  }
  return json(res, {
    orderId,
    razorpayOrderId: rzp.id,
    amount: rzp.amount,
    currency: rzp.currency || 'INR',
    keyId,
  });
}, {
  secrets: [...RAZORPAY_SECRETS, ...RESEND_SECRETS, ...WHATSAPP_SECRETS],
});

module.exports = { createOrder };
