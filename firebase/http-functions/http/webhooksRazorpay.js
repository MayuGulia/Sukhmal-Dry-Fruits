const { createHmac } = require('node:crypto');
const { json, httpsFn, RAZORPAY_WEBHOOK_SECRETS, RESEND_SECRETS, WHATSAPP_SECRETS } = require('../_shared/httpFn');
const { envGet } = require('../_shared/env');
const { confirmOrderPayment } = require('../_shared/firebaseAdmin');

function rawWebhookBody(req) {
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
  if (typeof req.rawBody === 'string') return Buffer.from(req.rawBody, 'utf8');
  return null;
}

const webhooksRazorpay = httpsFn(async (req, res) => {
  if (req.method !== 'POST') return json(res, { error: 'method' }, 405);
  const secret = envGet('RAZORPAY_WEBHOOK_SECRET');
  if (!secret) {
    return json(res, { error: 'not_configured', message: 'RAZORPAY_WEBHOOK_SECRET is required.' }, 501);
  }

  const raw = rawWebhookBody(req);
  if (!raw) return json(res, { error: 'invalid_json' }, 400);

  const sig = req.get('x-razorpay-signature') || req.headers['x-razorpay-signature'] || '';
  const expected = createHmac('sha256', secret).update(raw).digest('hex');
  if (expected !== sig) return json(res, { error: 'invalid_signature' }, 400);

  let event = {};
  try {
    event = JSON.parse(raw.toString('utf8'));
  } catch {
    return json(res, { error: 'invalid_json' }, 400);
  }

  if (event.event === 'payment.captured') {
    const entity = event.payload?.payment?.entity || {};
    const orderId = entity.notes?.orderId || entity.notes?.receipt;
    if (orderId) {
      await confirmOrderPayment(orderId, {
        razorpayPaymentId: entity.id || null,
        razorpayOrderId: entity.order_id || null,
      });
    }
  }
  return json(res, { ok: true });
}, {
  secrets: [...RAZORPAY_WEBHOOK_SECRETS, ...RESEND_SECRETS, ...WHATSAPP_SECRETS],
});

module.exports = { webhooksRazorpay, rawWebhookBody };
