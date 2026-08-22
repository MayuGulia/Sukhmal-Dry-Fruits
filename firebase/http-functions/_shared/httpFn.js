const { onRequest } = require('firebase-functions/v2/https');

const REGION = 'asia-south1';

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

module.exports = { REGION, CORS_ORIGINS, GEMINI_SECRETS, json, readJsonBody, httpsFn };
