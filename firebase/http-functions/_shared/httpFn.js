const { onRequest } = require('firebase-functions/v2/https');

const REGION = 'us-central1';

const CORS_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://sukhmaldryfruits.com',
  'https://www.sukhmaldryfruits.com',
  'https://sukhmal-website.web.app',
  'https://sukhmal-website.firebaseapp.com',
];

const GEMINI_SECRETS = [
  'GEMINI_API_KEY',
  'GEMINI_ASSISTANT_API_KEY',
  'GEMINI_IMAGE_API_KEY',
];

const RAZORPAY_SECRETS = [
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
];

const RAZORPAY_WEBHOOK_SECRETS = [
  'RAZORPAY_WEBHOOK_SECRET',
];

const RESEND_SECRETS = [
  'RESEND_API_KEY',
];

const WHATSAPP_SECRETS = [
  'WHATSAPP_OWNER_PHONE',
  'CALLMEBOT_API_KEY',
];

const VERTEX_RUNTIME_SA = 'firebase-adminsdk-fbsvc@sukhmal-website.iam.gserviceaccount.com';
const VERTEX_PREDICT_SA = '1035357939609-compute@developer.gserviceaccount.com';

function json(res, data, status = 200) {
  res.status(status).type('application/json').send(JSON.stringify(data));
}

function readJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body || '{}'); } catch { return {}; }
  }
  if (Buffer.isBuffer(req.body)) {
    try { return JSON.parse(req.body.toString('utf8') || '{}'); } catch { return {}; }
  }
  return {};
}

function httpsFn(handler, extras = {}) {
  return onRequest(
    {
      region: REGION,
      invoker: 'public',
      cors: CORS_ORIGINS,
      timeoutSeconds: 60,
      ...extras,
    },
    handler,
  );
}

module.exports = {
  REGION,
  CORS_ORIGINS,
  GEMINI_SECRETS,
  RAZORPAY_SECRETS,
  RAZORPAY_WEBHOOK_SECRETS,
  RESEND_SECRETS,
  WHATSAPP_SECRETS,
  VERTEX_RUNTIME_SA,
  VERTEX_PREDICT_SA,
  json,
  readJsonBody,
  httpsFn,
};
