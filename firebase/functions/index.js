const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const crypto = require('crypto');

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

const resendKey = defineSecret('RESEND_API_KEY');
const razorpayWebhookSecret = defineSecret('RAZORPAY_WEBHOOK_SECRET');
const msg91Key = defineSecret('MSG91_AUTH_KEY');

const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || 'mayu.gulia156@gmail.com';
const FROM_EMAIL = process.env.RESEND_FROM || 'Sukhmal Dry Fruits <onboarding@resend.dev>';
const ADMIN_PHONE = process.env.ADMIN_NOTIFY_PHONE || '918595321912';

function orderHtml(title, order, extra = '') {
  const items = (order.items || [])
    .map((it) => `<li>${it.qty || 1} × ${it.name || it.productId} — ₹${it.price || 0}</li>`)
    .join('');
  const addr = order.shippingAddress || {};
  return `
    <div style="font-family:Georgia,serif;color:#1F1610">
      <h2>${title}</h2>
      <p><strong>Order ID:</strong> ${order.orderId}</p>
      <p><strong>Status:</strong> ${order.orderStatus} · <strong>Payment:</strong> ${order.paymentStatus}</p>
      <p><strong>Total:</strong> ₹${order.total || order.totals?.total || 0}</p>
      <p><strong>Expected delivery:</strong> ${order.eta || '2–4 business days'}</p>
      <p><strong>Customer:</strong> ${order.customer?.name || addr.name || ''} · ${order.customer?.email || ''} · ${order.customer?.phone || addr.phone || ''}</p>
      <p><strong>Address:</strong> ${[addr.line1, addr.line2, addr.pincode].filter(Boolean).join(', ')}</p>
      <ul>${items}</ul>
      ${extra}
    </div>
  `;
}

async function sendEmail({ apiKey, to, subject, html }) {
  if (!apiKey || !to) {
    console.log('email skipped', { hasKey: Boolean(apiKey), to });
    return { skipped: true };
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) console.error('resend failed', res.status, body);
  return body;
}

async function sendSms({ authKey, to, message }) {
  const digits = String(to || '').replace(/\D/g, '');
  if (!authKey || digits.length < 10) {
    console.log('sms skipped', { hasKey: Boolean(authKey), to });
    return { skipped: true };
  }
  const mobile = digits.length === 10 ? `91${digits}` : digits;
  const url = `https://control.msg91.com/api/v5/flow`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { authkey: authKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      template_id: process.env.MSG91_TEMPLATE_ID || '',
      recipients: [{ mobiles: mobile, message }],
    }),
  });
  if (!res.ok) {
    const fallback = await fetch(
      `https://api.msg91.com/api/sendhttp.php?authkey=${encodeURIComponent(authKey)}&mobiles=${mobile}&message=${encodeURIComponent(message)}&sender=${encodeURIComponent(process.env.MSG91_SENDER || 'SUKHML')}&route=4&country=91`,
    );
    return { status: fallback.status };
  }
  return { status: res.status };
}

async function markConfirmed(orderId, extra = {}) {
  const ref = db.collection('orders').doc(orderId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const data = snap.data();
    if (data.paymentStatus === 'paid' && data.orderStatus === 'confirmed') return;
    const history = Array.isArray(data.statusHistory) ? data.statusHistory : [];
    history.push({
      status: 'confirmed',
      at: new Date().toISOString(),
      byAdmin: false,
      note: 'Payment verified server-side',
    });
    tx.update(ref, {
      paymentStatus: 'paid',
      orderStatus: 'confirmed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      statusHistory: history,
      ...extra,
    });
  });
}

exports.onOrderCreated = onDocumentCreated(
  { document: 'orders/{orderId}', secrets: [resendKey, msg91Key] },
  async (event) => {
    const order = event.data?.data() || {};
    const orderId = event.params.orderId;
    const payload = { ...order, orderId: order.orderId || orderId };
    const apiKey = resendKey.value();
    const smsKey = msg91Key.value();

    await sendEmail({
      apiKey,
      to: ADMIN_EMAIL,
      subject: `New order ${payload.orderId}`,
      html: orderHtml('New order received', payload),
    });
    await sendSms({
      authKey: smsKey,
      to: ADMIN_PHONE,
      message: `Sukhmal new order ${payload.orderId} · ₹${payload.total || 0} · ${payload.customer?.name || ''}`,
    });

    if (payload.customer?.email) {
      await sendEmail({
        apiKey,
        to: payload.customer.email,
        subject: `Order ${payload.orderId} received — Sukhmal Dry Fruits`,
        html: orderHtml(
          'Thank you for your order',
          payload,
          `<p>We’ll pack your hamper with care. Expected delivery: <strong>${payload.eta || '2–4 business days'}</strong>.</p>`,
        ),
      });
    }
    if (payload.customer?.phone || payload.shippingAddress?.phone) {
      await sendSms({
        authKey: smsKey,
        to: payload.customer?.phone || payload.shippingAddress?.phone,
        message: `Sukhmal: order ${payload.orderId} received. Expected delivery ${payload.eta || '2-4 days'}.`,
      });
    }
  },
);

exports.onOrderUpdated = onDocumentUpdated(
  { document: 'orders/{orderId}' },
  async (event) => {
    const before = event.data?.before?.data() || {};
    const after = event.data?.after?.data() || {};
    if (before.orderStatus === after.orderStatus) return;
    const history = Array.isArray(after.statusHistory) ? after.statusHistory : [];
    const last = history[history.length - 1];
    if (last && last.status === after.orderStatus) return;
    await event.data.after.ref.update({
      statusHistory: admin.firestore.FieldValue.arrayUnion({
        status: after.orderStatus,
        at: new Date().toISOString(),
        byAdmin: true,
        note: `Status changed from ${before.orderStatus} to ${after.orderStatus}`,
      }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  },
);

exports.razorpayWebhook = onRequest(
  { secrets: [razorpayWebhookSecret, resendKey] },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('method');
      return;
    }
    const secret = razorpayWebhookSecret.value();
    const raw = typeof req.rawBody === 'string' ? req.rawBody : JSON.stringify(req.body || {});
    const sig = req.get('x-razorpay-signature') || '';
    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    if (expected !== sig) {
      res.status(400).json({ error: 'invalid_signature' });
      return;
    }
    const event = req.body || {};
    const notes = event.payload?.payment?.entity?.notes || event.payload?.order?.entity?.notes || {};
    const orderId = notes.orderId || notes.receipt;
    if (event.event === 'payment.captured' && orderId) {
      await markConfirmed(orderId, {
        razorpayPaymentId: event.payload?.payment?.entity?.id || null,
      });
    }
    res.json({ ok: true });
  },
);
