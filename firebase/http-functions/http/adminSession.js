const { json, readJsonBody, httpsFn } = require('../_shared/httpFn');
const { adminAuth } = require('../_shared/firebaseAdmin');
const {
  authJson,
  authTimeIsFresh,
  notConfigured,
  sessionClearCookie,
  sessionSetCookie,
  unauthorized,
} = require('../_shared/adminSession');

const createAdminSession = httpsFn(async (req, res) => {
  if (req.method !== 'POST') return json(res, { error: 'method' }, 405);

  const body = readJsonBody(req);
  const idToken = typeof body?.idToken === 'string' ? body.idToken.trim() : '';
  if (!idToken) return json(res, { error: 'invalid_request' }, 400);

  const auth = await adminAuth();
  if (!auth) return notConfigured(res);

  let decoded;
  try {
    decoded = await auth.verifyIdToken(idToken);
  } catch (err) {
    console.error('admin session token verify failed', err?.code || 'verify_failed');
    return unauthorized(res);
  }

  if (decoded.admin !== true) return authJson(res, { error: 'forbidden' }, 403);
  if (!authTimeIsFresh(decoded)) return unauthorized(res);

  let sessionCookie;
  try {
    sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: 60 * 60 * 1000 });
  } catch (err) {
    console.error('admin session cookie mint failed', err?.code || 'mint_failed');
    return unauthorized(res);
  }

  return authJson(res, { ok: true, expiresIn: 60 * 60 }, 200, sessionSetCookie(sessionCookie));
});

const clearAdminSession = httpsFn(async (req, res) => {
  if (req.method !== 'POST') return json(res, { error: 'method' }, 405);
  return authJson(res, { ok: true }, 200, sessionClearCookie());
});

module.exports = { createAdminSession, clearAdminSession };
