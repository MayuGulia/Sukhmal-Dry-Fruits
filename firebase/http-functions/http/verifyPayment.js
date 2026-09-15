const { createHmac } = require('node:crypto');
const { json, readJsonBody, httpsFn, RAZORPAY_SECRETS, RESEND_SECRETS, WHATSAPP_SECRETS } = require('../_shared/httpFn');
const { envGet } = require('../_shared/env');
const { confirmOrderPayment } = require('../_shared/firebaseAdmin');

const verifyPayment = httpsFn(async (req, res) => {
  if (req.method !== 'POST') return json(res, { error: 'method' }, 405);
  const secret = envGet('RAZORPAY_KEY_SECRET');
  if (!secret) {
    return json(res, { error: 'not_configured', message: 'RAZORPAY_KEY_SECRET is required to verify payments.' }, 501);
  }
  const body = readJsonBody(req);
  const orderId = body.razorpay_order_id;
  const paymentId = body.razorpay_payment_id;
  const signature = body.razorpay_signature;
  const storeOrderId = body.orderId;
  if (!orderId || !paymentId || !signature) return json(res, { error: 'missing_fields' }, 400);

  const expected = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  if (expected !== signature) return json(res, { error: 'invalid_signature' }, 400);

  const result = await confirmOrderPayment(storeOrderId || '', {
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
  });
  return json(res, {
    ok: true,
    verified: true,
    firestoreUpdated: Boolean(result.updated),
  });
}, {
  secrets: [...RAZORPAY_SECRETS, ...RESEND_SECRETS, ...WHATSAPP_SECRETS],
});

module.exports = { verifyPayment };
