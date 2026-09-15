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

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

function inr(value) {
  return `₹${rupee(value).toLocaleString('en-IN')}`;
}

function row(label, value) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  return `<tr><td style="padding:6px 12px 6px 0;color:#6b5e54;vertical-align:top;white-space:nowrap">${esc(label)}</td><td style="padding:6px 0;color:#1f1610"><strong>${esc(text)}</strong></td></tr>`;
}

function rawRow(label, html) {
  if (!html) return '';
  return `<tr><td style="padding:6px 12px 6px 0;color:#6b5e54;vertical-align:top;white-space:nowrap">${esc(label)}</td><td style="padding:6px 0;color:#1f1610">${html}</td></tr>`;
}

function formatAddressHtml(addr = {}, fallbackName = '') {
  const lines = [
    addr.name || fallbackName,
    addr.line1,
    addr.line2,
    [addr.city, addr.state].filter(Boolean).join(', '),
    addr.pincode ? `PIN ${addr.pincode}` : '',
    addr.landmark,
  ].map((line) => String(line || '').trim()).filter(Boolean);
  if (!lines.length) return '—';
  return lines.map((line) => esc(line)).join('<br/>');
}

function cartRows(order = {}) {
  const items = Array.isArray(order.items) ? order.items : [];
  if (!items.length) {
    return '<tr><td colspan="4" style="padding:8px 0;color:#6b5e54">No items in this order.</td></tr>';
  }
  return items.map((it) => {
    const qty = rupee(it.qty) || 1;
    const price = rupee(it.price);
    const line = qty * price;
    const name = [it.name || it.productId || 'Item', it.variant || it.weight].filter(Boolean).join(' · ');
    return `<tr>
      <td style="padding:8px 12px 8px 0;border-bottom:1px solid #eee">${esc(name)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${qty}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${esc(inr(price))}</td>
      <td style="padding:8px 0 8px 12px;border-bottom:1px solid #eee;text-align:right">${esc(inr(line))}</td>
    </tr>`;
  }).join('');
}

function ownerOrderHtml(order = {}) {
  const addr = order.shippingAddress || {};
  const customer = order.customer || {};
  const gift = order.giftMsg || {};
  const name = customer.name || addr.name || '';
  const phone = customer.phone || addr.phone || '';
  const email = orderCustomerEmail(order);
  const totals = order.totals || {};
  const subtotal = rupee(totals.subtotal);
  const discount = rupee(totals.discount);
  const gst = rupee(totals.gst);
  const shipping = rupee(totals.shipping);
  const total = rupee(order.total ?? totals.total);
  const method = String(order.paymentMethod || '').toUpperCase();
  const coupon = order.coupon?.code || order.coupon || '';
  const delivery = order.customDate || order.deliveryDate || order.eta || '';
  return `
    <div style="font-family:Georgia,serif;color:#1f1610;max-width:640px">
      <h2 style="margin:0 0 12px">New Sukhmal order ${esc(order.orderId || '')}</h2>
      <table style="border-collapse:collapse;width:100%;font-size:14px">
        ${row('Order ID', order.orderId || '')}
        ${row('Customer', name)}
        ${row('Phone', phone)}
        ${row('Email', email)}
        ${rawRow('Shipping address', formatAddressHtml(addr, name))}
        ${row('Pincode', addr.pincode || '')}
        ${row('Payment', method || '—')}
        ${row('Payment status', order.paymentStatus || '')}
        ${row('Coupon', coupon)}
        ${row('Delivery', delivery)}
        ${row('Gift to', gift.name || '')}
        ${row('Gift phone', gift.phone || '')}
        ${row('Gift message', gift.text || '')}
      </table>
      <h3 style="margin:22px 0 8px">Cart</h3>
      <table style="border-collapse:collapse;width:100%;font-size:14px">
        <thead>
          <tr>
            <th style="text-align:left;padding:0 12px 8px 0;border-bottom:2px solid #C59B27">Item</th>
            <th style="text-align:center;padding:0 12px 8px;border-bottom:2px solid #C59B27">Qty</th>
            <th style="text-align:right;padding:0 12px 8px;border-bottom:2px solid #C59B27">Price</th>
            <th style="text-align:right;padding:0 0 8px 12px;border-bottom:2px solid #C59B27">Line total</th>
          </tr>
        </thead>
        <tbody>${cartRows(order)}</tbody>
      </table>
      <table style="border-collapse:collapse;margin-top:16px;font-size:14px;margin-left:auto">
        ${row('Subtotal', inr(subtotal))}
        ${discount ? row('Discount', `− ${inr(discount)}`) : ''}
        ${row('GST', inr(gst))}
        ${row('Shipping', inr(shipping))}
        ${row('Grand total', inr(total))}
      </table>
    </div>
  `;
}

function enquiryHtml(fields = {}) {
  const rows = Object.entries(fields)
    .filter(([, value]) => String(value || '').trim())
    .map(([label, value]) => row(label, value))
    .join('');
  return `
    <div style="font-family:Georgia,serif;color:#1f1610;max-width:640px">
      <table style="border-collapse:collapse;width:100%;font-size:14px">${rows}</table>
    </div>
  `;
}

async function sendResend({ to, subject, html, replyTo }) {
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
        reply_to: firstEmail(replyTo) || ownerNotifyTo(),
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
    subject: `New order ${orderId} — ${inr(order.total ?? order.totals?.total)}`,
    html: ownerOrderHtml(order),
    replyTo: orderCustomerEmail(order),
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
      <p>We’ll pack your order with care. Expected delivery: <strong>${esc(eta)}</strong>.</p>
      <p>Track it with Order ID <strong>${esc(orderId)}</strong>.</p>
    `,
    replyTo: ownerNotifyTo(),
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

async function notifyOwnerOfEnquiry({ subject, fields, replyTo }) {
  const sent = await sendResend({
    to: ownerNotifyTo(),
    subject,
    html: enquiryHtml(fields),
    replyTo,
  });
  if (!sent?.ok && !sent?.skipped) console.error('owner enquiry email failed', subject, sent);
  return sent;
}

module.exports = {
  ownerNotifyTo,
  ownerOrderHtml,
  orderCustomerEmail,
  sendResend,
  notifyOwnerOfOrder,
  notifyCustomerOfOrder,
  notifyOrderPlaced,
  notifyOwnerOfEnquiry,
};
