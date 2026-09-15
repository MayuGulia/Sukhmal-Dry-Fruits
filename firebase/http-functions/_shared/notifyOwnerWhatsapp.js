const { envGet } = require('./env');

const CALLMEBOT_URL = 'https://api.callmebot.com/whatsapp.php';
const TIMEOUT_MS = 7000;

function itemNames(order = {}) {
  const items = Array.isArray(order.items) ? order.items : [];
  const names = items
    .map((it) => String(it.name || it.productId || '').trim())
    .filter(Boolean);
  if (!names.length) return 'none';
  const summary = names.join(', ');
  return summary.length > 220 ? `${summary.slice(0, 217)}...` : summary;
}

function itemCount(order = {}) {
  const items = Array.isArray(order.items) ? order.items : [];
  const count = items.reduce((sum, it) => {
    const qty = Number(it.qty);
    return sum + (Number.isFinite(qty) && qty > 0 ? qty : 1);
  }, 0);
  return count || items.length;
}

function buildMessage(order = {}) {
  const orderId = String(order.orderId || '').trim() || 'unknown';
  const customer = order.customer || {};
  const addr = order.shippingAddress || {};
  const name = String(customer.name || addr.name || 'Customer').trim();
  const phone = String(customer.phone || addr.phone || '').trim();
  const pin = String(addr.pincode || '').trim();
  const address = [addr.line1, addr.line2, pin ? `PIN ${pin}` : ''].filter(Boolean).join(', ');
  const total = order.total ?? order.totals?.total ?? 0;
  const method = String(order.paymentMethod || '').toUpperCase();
  return [
    `New Sukhmal order ${orderId}`,
    `Customer: ${name}`,
    phone ? `Phone: ${phone}` : '',
    address ? `Address: ${address}` : '',
    method ? `Payment: ${method}` : '',
    `Total: ₹${total}`,
    `Items (${itemCount(order)}): ${itemNames(order)}`,
  ].filter(Boolean).join('\n');
}

function isAbort(err) {
  const name = String(err?.name || '');
  return name === 'AbortError' || name === 'TimeoutError' || err?.code === 'ABORT_ERR';
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { method: 'GET', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Owner WhatsApp ping. Never throws — order creation must not depend on CallMeBot. */
async function notifyOwnerWhatsapp(order = {}) {
  try {
    const orderId = String(order.orderId || '').trim();
    const phone = envGet('WHATSAPP_OWNER_PHONE').replace(/\D/g, '');
    const apikey = envGet('CALLMEBOT_API_KEY');
    if (!phone || !apikey) {
      console.log('owner whatsapp skipped', orderId || '(no-id)', !phone ? 'missing_phone' : 'missing_apikey');
      return { skipped: true, reason: !phone ? 'missing_phone' : 'missing_apikey' };
    }
    const text = buildMessage(order);
    const url = `${CALLMEBOT_URL}?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;
    const res = await fetchWithTimeout(url);
    const body = await res.text().catch(() => '');
    if (!res.ok) {
      console.error('owner whatsapp failed', orderId, res.status, body.slice(0, 200));
      return { ok: false, status: res.status };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    console.error('owner whatsapp throw', order?.orderId, isAbort(err) ? 'timeout' : err?.message);
    return { ok: false, reason: isAbort(err) ? 'timeout' : (err?.message || 'network') };
  }
}

module.exports = { notifyOwnerWhatsapp, buildMessage };
