const { createHmac } = require('node:crypto');
const path = require('node:path');
const { notifyOwnerWhatsapp } = require('../../firebase/http-functions/_shared/notifyOwnerWhatsapp');

try {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
} catch {}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readJson(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      resolve(req.body);
      return;
    }
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (err) { reject(err); }
    });
    req.on('error', reject);
  });
}

function json(res, data, status = 200) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(status).json(data);
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

async function addResendContact(email) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { skipped: true };
  const admin = process.env.ADMIN_NOTIFY_EMAIL || process.env.REACT_APP_ADMIN_EMAIL || 'sukhmaldryfruitskorner2@gmail.com';
  const from = process.env.RESEND_FROM || 'Sukhmal Dry Fruits <onboarding@resend.dev>';
  const send = async (to, subject, html) => fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  const adminRes = await send(admin, `Newsletter signup: ${email}`, `<p>${email} joined the Sukhmal mailing list.</p>`);
  await send(email, 'You’re on the Sukhmal list', '<p>Thanks for subscribing to Sukhmal Dry Fruits.</p>').catch(() => {});
  return { ok: true, already: false, status: adminRes.status };
}

function registerCommerceRoutes(app) {
  app.post('/api/subscribe', async (req, res) => {
    const body = await readJson(req).catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return json(res, { error: 'invalid_email', message: 'Please enter a valid email address.' }, 400);
    try {
      const result = await addResendContact(email);
      return json(res, {
        ok: true,
        already: Boolean(result.already),
        skipped: Boolean(result.skipped),
        message: result.already ? 'You’re already subscribed.' : 'You’re subscribed. Welcome to Sukhmal.',
      });
    } catch {
      return json(res, { ok: true, message: 'You’re subscribed. Welcome to Sukhmal.' });
    }
  });

  app.post('/api/feedback', async (req, res) => {
    const body = await readJson(req).catch(() => ({}));
    if (String(body.company || '').trim()) return json(res, { ok: true });
    const name = String(body.name || '').replace(/<[^>]*>/g, '').trim().slice(0, 80);
    const email = String(body.email || '').trim().toLowerCase();
    const text = String(body.message || body.text || '').replace(/<[^>]*>/g, '').trim().slice(0, 600);
    const rating = Math.round(Number(body.rating));
    if (name.length < 2) return json(res, { error: 'invalid_name', message: 'Please enter your name.' }, 400);
    if (!rating || rating < 1 || rating > 5) return json(res, { error: 'invalid_rating', message: 'Please choose a star rating.' }, 400);
    if (text.length < 8) return json(res, { error: 'invalid_text', message: 'Please write a few words about your experience.' }, 400);
    if (email && !EMAIL_RE.test(email)) return json(res, { error: 'invalid_email', message: 'Please enter a valid email address.' }, 400);
    const key = process.env.RESEND_API_KEY;
    const to = process.env.ADMIN_NOTIFY_EMAIL || process.env.REACT_APP_ADMIN_EMAIL || 'sukhmaldryfruitskorner2@gmail.com';
    const from = process.env.RESEND_FROM || 'Sukhmal Dry Fruits <onboarding@resend.dev>';
    if (key && to) {
      const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: [to],
          reply_to: email || to,
          subject: `New homepage feedback (${rating}/5) from ${name}`,
          html: `<p><strong>Rating:</strong> ${stars} (${rating}/5)</p><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email || '—'}</p><p>${text}</p>`,
        }),
      }).catch(() => {});
    }
    return json(res, { ok: true });
  });

  app.post('/api/create-order', async (req, res) => {
    const body = await readJson(req).catch(() => ({}));
    const orderId = String(body.orderId || '').trim();
    if (body.paymentMethod === 'cod') {
      const key = process.env.RESEND_API_KEY;
      const to = process.env.ADMIN_NOTIFY_EMAIL || process.env.REACT_APP_ADMIN_EMAIL || 'sukhmaldryfruitskorner2@gmail.com';
      const from = process.env.RESEND_FROM || 'Sukhmal Dry Fruits <onboarding@resend.dev>';
      const order = body.order && typeof body.order === 'object' ? body.order : { orderId };
      const customer = order.customer || {};
      const addr = order.shippingAddress || {};
      const items = Array.isArray(order.items) ? order.items : [];
      const html = `
        <p><strong>Order ID:</strong> ${order.orderId || orderId}</p>
        <p><strong>Customer:</strong> ${customer.name || addr.name || ''} · ${customer.phone || addr.phone || ''}${customer.email || addr.email || order.email ? ` · ${customer.email || addr.email || order.email}` : ''}</p>
        <p><strong>Payment:</strong> ${order.paymentMethod || 'cod'}</p>
        <p><strong>Total:</strong> ₹${order.total ?? order.totals?.total ?? 0}</p>
        <ul>${items.map((it) => `<li>${it.qty || 1} × ${it.name || it.productId || ''} — ₹${it.price || 0}</li>`).join('')}</ul>
      `;
      const customerEmail = String(customer.email || addr.email || order.email || '').trim().toLowerCase();
      const sendMail = async (dest, subject, bodyHtml) => {
        if (!key || !dest) return { skipped: true, reason: !key ? 'missing_key' : 'missing_to' };
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from, to: [dest], reply_to: to, subject, html: bodyHtml }),
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) console.error('resend failed', dest, r.status, data);
        return { ok: r.ok, status: r.status, id: data.id || null, skipped: false, reason: data.message || null };
      };
      const owner = await sendMail(to, `New order ${order.orderId || orderId}`, html);
      const customerNotify = await sendMail(
        customerEmail,
        `Order ${order.orderId || orderId} confirmed — Sukhmal Dry Fruits`,
        `${html}<p>Track it with Order ID <strong>${order.orderId || orderId}</strong>.</p>`,
      );
      try {
        await notifyOwnerWhatsapp({
          ...order,
          orderId: order.orderId || orderId,
        });
      } catch (err) {
        console.error('owner whatsapp ignored', order.orderId || orderId, err?.message);
      }
      return json(res, {
        orderId,
        paymentMethod: 'cod',
        skipPayment: true,
        ownerNotified: Boolean(owner.ok),
        customerNotified: Boolean(customerNotify.ok),
        ownerNotify: owner,
        customerNotify,
      });
    }
    const keyId = process.env.RAZORPAY_KEY_ID;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !secret) {
      return json(res, { orderId, skipPayment: true, message: 'Razorpay keys are not set.' });
    }
    const amountPaise = Math.round(Number(body.amount || body.total || 0) * 100);
    if (!orderId || amountPaise < 100) return json(res, { error: 'invalid_order' }, 400);
    const auth = Buffer.from(`${keyId}:${secret}`).toString('base64');
    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt: orderId, notes: { orderId } }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return json(res, { error: 'razorpay_create_failed', details: data }, 502);
    return json(res, { orderId, razorpayOrderId: data.id, amount: data.amount, currency: data.currency || 'INR', keyId });
  });

  app.post('/api/verify-payment', async (req, res) => {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return json(res, { error: 'not_configured' }, 501);
    const body = await readJson(req).catch(() => ({}));
    if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
      return json(res, { error: 'missing_fields' }, 400);
    }
    const expected = createHmac('sha256', secret)
      .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
      .digest('hex');
    if (expected !== body.razorpay_signature) return json(res, { error: 'invalid_signature' }, 400);
    return json(res, { ok: true, verified: true, firestoreUpdated: false });
  });
}

module.exports = { registerCommerceRoutes };
