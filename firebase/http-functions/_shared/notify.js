const { envGet } = require('./env');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ownerNotifyTo() {
  return firstEmail(envGet('ADMIN_NOTIFY_EMAIL'), envGet('REACT_APP_ADMIN_EMAIL'))
    || 'sukhmaldryfruitskorner2@gmail.com';
}

function firstEmail(...values) {
  for (const value of values) {
    const email = String(value || '').trim().toLowerCase();
    if (EMAIL_RE.test(email)) return email;
  }
  return '';
}

function orderCustomerEmail(order = {}) {
  const customer = order.customer || {};
  const addr = order.shippingAddress || {};
  return firstEmail(customer.email, addr.email, order.email);
}

function compactNotify(sent = {}) {
  return {
    ok: Boolean(sent.ok),
    status: sent.status || null,
    id: sent.id || null,
    skipped: Boolean(sent.skipped),
    reason: sent.reason || sent.data?.message || sent.data?.name || null,
  };
}

function rupee(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function ownerOrderHtml(order = {}) {
  const addr = order.shippingAddress || {};
  const customer = order.customer || {};
  const name = customer.name || addr.name || '';
  const phone = customer.phone || addr.phone || '';
  const email = orderCustomerEmail(order);
  const totals = order.totals || {};
  const subtotal = rupee(totals.subtotal);
  const discount = rupee(totals.discount);
  const gst = rupee(totals.gst);
  const shipping = rupee(totals.shipping);
  const total = order.total ?? totals.total ?? 0;
  const method = order.paymentMethod || '';
  const shipName = addr.name || name;
  const address = [shipName, addr.line1, addr.pincode].filter(Boolean).join(', ');
  const items = (Array.isArray(order.items) ? order.items : [])
    .map((it) => `<li>${it.qty || 1} × ${it.name || it.productId || ''} — ₹${it.price || 0}</li>`)
    .join('');
  return `
    <p><strong>Order ID:</strong> ${order.orderId || ''}</p>
    <p><strong>Customer:</strong> ${name} · ${phone}${email ? ` · ${email}` : ''}</p>
    <p><strong>Shipping address:</strong> ${address}</p>
    <p><strong>Payment:</strong> ${method}</p>
    <p><strong>Subtotal:</strong> ₹${subtotal}</p>
    <p><strong>Discount:</strong> ₹${discount}</p>
    <p><strong>GST:</strong> ₹${gst}</p>
    <p><strong>Shipping:</strong> ₹${shipping}</p>
    <p><strong>Total:</strong> ₹${total}</p>
    <ul>${items}</ul>
  `;
}

async function sendResend({ to, subject, html }) {
  const key = envGet('RESEND_API_KEY');
  const dest = firstEmail(...(Array.isArray(to) ? to : [to]));
  if (!key || !dest) return { skipped: true, reason: !key ? 'missing_key' : 'missing_to' };
  const from = envGet('RESEND_FROM') || 'Sukhmal Dry Fruits <onboarding@resend.dev>';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [dest],
        reply_to: ownerNotifyTo(),
        subject,
        html,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) console.error('resend failed', dest, res.status, data);
    return { ok: res.ok, status: res.status, id: data?.id || null, data };
  } catch (err) {
    console.error('resend throw', dest, err?.message);
    return { ok: false, reason: err?.message || 'network' };
  }
}

async function notifyOwnerOfOrder(order = {}) {
  const orderId = order.orderId || '';
  if (!orderId) return { skipped: true, reason: 'missing_order' };
  const sent = await sendResend({
    to: ownerNotifyTo(),
    subject: `New order ${orderId}`,
    html: ownerOrderHtml(order),
  });
  if (!sent?.ok) console.error('owner order email failed', orderId, sent);
  return sent;
}

async function notifyCustomerOfOrder(order = {}) {
  const to = orderCustomerEmail(order);
  const orderId = order.orderId || '';
  if (!to || !orderId) {
    const skipped = { skipped: true, reason: 'missing_customer_email' };
    console.warn('customer order email skipped', orderId, skipped.reason);
    return skipped;
  }
  const eta = order.eta || '2–4 business days';
  const sent = await sendResend({
    to,
    subject: `Order ${orderId} confirmed — Sukhmal Dry Fruits`,
    html: `
      ${ownerOrderHtml(order)}
      <p>We’ll pack your order with care. Expected delivery: <strong>${eta}</strong>.</p>
      <p>Track it with Order ID <strong>${orderId}</strong>.</p>
    `,
  });
  if (!sent?.ok) console.error('customer order email failed', orderId, to, sent);
  return sent;
}

async function notifyOrderPlaced(order = {}) {
  const owner = await notifyOwnerOfOrder(order);
  const customer = await notifyCustomerOfOrder(order);
  return {
    ownerNotified: Boolean(owner?.ok),
    customerNotified: Boolean(customer?.ok),
    ownerNotify: compactNotify(owner),
    customerNotify: compactNotify(customer),
  };
}

module.exports = {
  ownerNotifyTo,
  ownerOrderHtml,
  orderCustomerEmail,
  sendResend,
  notifyOwnerOfOrder,
  notifyCustomerOfOrder,
  notifyOrderPlaced,
};
