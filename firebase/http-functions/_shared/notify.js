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
  return firstEmail(order.email, customer.email, addr.email);
}

function siteOrigin() {
  return String(envGet('SITE_ORIGIN') || 'https://sukhmaldryfruits.com').replace(/\/$/, '');
}

function deliveryCopy(order = {}) {
  const { estimateDeliveryByPincode } = require('./deliveryEstimate');
  const pin = order.shippingAddress?.pincode || order.pincode || '';
  const guess = estimateDeliveryByPincode(pin);
  const range = order.estimatedDeliveryDate || order.eta || guess.estimatedDeliveryDate;
  const window = order.estimatedDeliveryWindow || guess.window;
  return {
    pin: String(pin || '').replace(/\D/g, '').slice(0, 6),
    range,
    window,
    zone: guess.zoneLabel,
  };
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
  const preferred = envGet('RESEND_FROM') || 'Sukhmal Dry Fruits <info@sukhmaldryfruits.com>';
  const froms = [preferred];
  if (!/onboarding@resend\.dev/i.test(preferred)) {
    froms.push('Sukhmal Dry Fruits <onboarding@resend.dev>');
  }
  let last = { ok: false, reason: 'resend_failed' };
  for (const from of froms) {
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
      if (res.ok) return { ok: true, status: res.status, id: data?.id || null, data, from };
      last = { ok: false, status: res.status, id: data?.id || null, data };
      console.error('resend failed', dest, from, res.status, data);
    } catch (err) {
      last = { ok: false, reason: err?.message || 'network' };
      console.error('resend throw', dest, err?.message);
    }
  }
  return last;
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

function customerOrderHtml(order = {}) {
  const addr = order.shippingAddress || {};
  const customer = order.customer || {};
  const name = customer.name || addr.name || 'there';
  const orderId = order.orderId || '';
  const total = rupee(order.total ?? order.totals?.total);
  const method = String(order.paymentMethod || '').toLowerCase() === 'cod'
    ? 'Cash on Delivery'
    : 'Paid online';
  const delivery = deliveryCopy(order);
  const trackUrl = `${siteOrigin()}/track-order?id=${encodeURIComponent(orderId)}`;
  const pinLine = delivery.pin
    ? `For pincode <strong>${esc(delivery.pin)}</strong>, your hamper is expected in <strong>${esc(delivery.window)}</strong> (${esc(delivery.range)}).`
    : `Your hamper is expected in <strong>${esc(delivery.window)}</strong> (${esc(delivery.range)}).`;
  return `
    <div style="font-family:Georgia,'Times New Roman',serif;color:#1f1610;max-width:640px;margin:0 auto;background:#FDFCFB">
      <div style="background:#3C2415;color:#F7E7C3;padding:28px 28px 24px;text-align:center">
        <div style="letter-spacing:0.28em;font-size:11px;text-transform:uppercase;opacity:0.85">Sukhmal Dry Fruits</div>
        <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;color:#F7E7C3">Thank you for your order</h1>
      </div>
      <div style="padding:28px;border:1px solid #E8DCC8;border-top:none">
        <p style="margin:0 0 14px;font-size:16px;line-height:1.55">Dear ${esc(name)},</p>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.65">
          Your order has been placed successfully. We are honoured you chose Sukhmal —
          every nut, date, and dry fruit is handpicked so this box feels as special as the moment it arrives.
        </p>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.65">${pinLine}</p>
        <div style="background:#F6EFE4;border:1px solid #E8DCC8;border-radius:12px;padding:16px 18px;margin:0 0 22px">
          <table style="border-collapse:collapse;width:100%;font-size:14px">
            ${row('Order ID', orderId)}
            ${row('Payment', method)}
            ${row('Order total', inr(total))}
            ${row('Pincode', delivery.pin || '—')}
            ${row('Estimated delivery', `${delivery.window} · ${delivery.range}`)}
          </table>
        </div>
        <h2 style="margin:0 0 10px;font-size:18px;color:#3C2415">What you ordered</h2>
        <table style="border-collapse:collapse;width:100%;font-size:14px">
          <thead>
            <tr>
              <th style="text-align:left;padding:0 12px 8px 0;border-bottom:2px solid #C59B27">Item</th>
              <th style="text-align:center;padding:0 12px 8px;border-bottom:2px solid #C59B27">Qty</th>
              <th style="text-align:right;padding:0 12px 8px;border-bottom:2px solid #C59B27">Price</th>
              <th style="text-align:right;padding:0 0 8px 12px;border-bottom:2px solid #C59B27">Amount</th>
            </tr>
          </thead>
          <tbody>${cartRows(order)}</tbody>
        </table>
        <table style="border-collapse:collapse;width:100%;font-size:14px;margin-top:16px">
          ${rawRow('Delivering to', formatAddressHtml(addr, name))}
        </table>
        <p style="margin:22px 0 8px;font-size:15px;line-height:1.65">
          We will confirm, pack, and dispatch your order with care. Follow every step with your Order ID.
        </p>
        <p style="text-align:center;margin:24px 0 8px">
          <a href="${esc(trackUrl)}" style="display:inline-block;background:#3C2415;color:#F7E7C3;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px;letter-spacing:0.04em">Track your order</a>
        </p>
        <p style="margin:18px 0 0;font-size:13px;color:#6b5e54;line-height:1.55;text-align:center">
          Save this email. For anything at all, simply reply — we are always glad to help.
        </p>
        <p style="margin:22px 0 0;font-size:15px;line-height:1.6">
          With warmth,<br/>
          <strong>The Sukhmal family</strong>
        </p>
      </div>
    </div>
  `;
}

async function notifyCustomerOfOrder(order = {}) {
  const to = orderCustomerEmail(order);
  const orderId = order.orderId || '';
  if (!to || !orderId) {
    const skipped = { skipped: true, reason: 'missing_customer_email' };
    console.warn('customer order email skipped', orderId, skipped.reason);
    return skipped;
  }
  const delivery = deliveryCopy(order);
  const html = customerOrderHtml(order);
  const sent = await sendResend({
    to,
    subject: `Thank you — order ${orderId} is placed · arriving in ${delivery.window}`,
    html,
    replyTo: ownerNotifyTo(),
  });
  if (sent?.ok) return sent;
  console.error('customer order email failed', orderId, to, sent);
  const owner = ownerNotifyTo();
  if (owner && owner !== to) {
    const forwarded = await sendResend({
      to: owner,
      subject: `Customer copy (deliver to ${to}) — order ${orderId} placed`,
      html: `<p style="font-size:13px;color:#6b5e54">Resend could not deliver to <strong>${esc(to)}</strong>. Forward this confirmation to the customer.</p>${html}`,
      replyTo: to,
    });
    return { ...sent, forwardedToOwner: Boolean(forwarded?.ok) };
  }
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

async function notifyCustomerShipped(order = {}) {
  const { courierTrackingUrl } = require('./orderStatus');
  const to = orderCustomerEmail(order);
  const orderId = order.orderId || '';
  const tracking = String(order.trackingNumber || '').trim();
  const courier = String(order.courierName || 'DTDC').trim() || 'DTDC';
  const eta = order.estimatedDeliveryDate || order.eta || '';
  const trackUrl = courierTrackingUrl(courier, tracking);
  if (!to || !orderId) {
    const skipped = { skipped: true, reason: 'missing_customer_email' };
    console.warn('customer shipped email skipped', orderId, skipped.reason);
    return skipped;
  }
  const trackingBlock = tracking
    ? `<p>Courier: <strong>${esc(courier)}</strong><br/>Tracking number: <strong>${esc(tracking)}</strong><br/><a href="${esc(trackUrl)}">Track shipment</a></p>`
    : `<p>Your order is with <strong>${esc(courier)}</strong>. Tracking details will follow shortly.</p>`;
  const sent = await sendResend({
    to,
    subject: `Order ${orderId} shipped — Sukhmal Dry Fruits`,
    html: `
      <div style="font-family:Georgia,serif;color:#1f1610;max-width:640px">
        <h2 style="margin:0 0 12px">Your order is on its way</h2>
        <p>Order <strong>${esc(orderId)}</strong> has been shipped.</p>
        ${trackingBlock}
        ${eta ? `<p>Estimated delivery: <strong>${esc(eta)}</strong>.</p>` : ''}
        <p>This is an interim update. Live courier status and ETA will use DTDC once the API key is available.</p>
      </div>
    `,
    replyTo: ownerNotifyTo(),
  });
  if (!sent?.ok) console.error('customer shipped email failed', orderId, to, sent);
  return sent;
}

async function notifyOrderShipped(order = {}) {
  const customer = await notifyCustomerShipped(order);
  return {
    customerNotified: Boolean(customer?.ok),
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
  notifyCustomerShipped,
  notifyOrderShipped,
};
