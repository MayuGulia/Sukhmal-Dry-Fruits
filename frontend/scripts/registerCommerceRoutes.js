const { createHmac } = require('node:crypto');
const path = require('node:path');
const { notifyOwnerWhatsapp } = require('../../firebase/http-functions/_shared/notifyOwnerWhatsapp');
const { notifyOrderPlaced, notifyOwnerOfEnquiry } = require('../../firebase/http-functions/_shared/notify');

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

  const handleEnquiry = async (req, res, kind) => {
    const body = await readJson(req).catch(() => ({}));
    if (kind === 'contact' || body.type === 'contact') {
      const first = String(body.first || '').replace(/<[^>]*>/g, '').trim().slice(0, 80);
      const last = String(body.last || '').replace(/<[^>]*>/g, '').trim().slice(0, 80);
      const name = [first, last].filter(Boolean).join(' ').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const phone = String(body.phone || '').trim();
      const subject = String(body.subject || '').replace(/<[^>]*>/g, '').trim().slice(0, 160);
      const qtype = String(body.qtype || 'General').trim();
      const orderId = String(body.orderId || '').trim();
      const message = String(body.msg || body.message || '').replace(/<[^>]*>/g, '').trim().slice(0, 2000);
      if (name.length < 2) return json(res, { error: 'invalid_name' }, 400);
      if (!EMAIL_RE.test(email)) return json(res, { error: 'invalid_email' }, 400);
      if (message.length < 4) return json(res, { error: 'invalid_message' }, 400);
      const sent = await notifyOwnerOfEnquiry({
        subject: `Contact form: ${subject || qtype} from ${name}`,
        replyTo: email,
        fields: {
          Name: name, Email: email, Phone: phone, Subject: subject,
          'Query type': qtype, 'Order ID': orderId, Message: message,
        },
      });
      return json(res, { ok: true, ownerNotified: Boolean(sent?.ok) });
    }
    const digits = String(body.phone || '').replace(/\D/g, '');
    const phone = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits.slice(-10);
    if (!/^[6-9]\d{9}$/.test(phone)) return json(res, { error: 'invalid_phone' }, 400);
    const email = String(body.email || '').trim().toLowerCase();
    const name = String(body.name || '').replace(/<[^>]*>/g, '').trim().slice(0, 80);
    const sent = await notifyOwnerOfEnquiry({
      subject: `Bulk enquiry${body.occasion ? ` (${body.occasion})` : ''} from ${name || phone}`,
      replyTo: email,
      fields: {
        Company: body.company || body.companyName || '',
        Name: name,
        Phone: phone,
        Email: email,
        Quantity: body.qty || body.quantity || '',
        Occasion: body.occasion || '',
        Notes: String(body.notes || '').replace(/<[^>]*>/g, '').trim().slice(0, 500),
      },
    });
    return json(res, { ok: true, ownerNotified: Boolean(sent?.ok) });
  };
  app.post('/api/enquiry/bulk', (req, res) => handleEnquiry(req, res, 'bulk'));
  app.post('/api/enquiry/contact', (req, res) => handleEnquiry(req, res, 'contact'));

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
      const order = body.order && typeof body.order === 'object' ? body.order : { orderId };
      const notify = await notifyOrderPlaced({
        ...order,
        orderId: order.orderId || orderId,
      });
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
        ...notify,
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
