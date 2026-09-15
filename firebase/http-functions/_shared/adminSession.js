const { json } = require('./httpFn');
const { adminAuth } = require('./firebaseAdmin');

const SESSION_COOKIE = '__session';
const SESSION_EXPIRES_MS = 60 * 60 * 1000;
const AUTH_WINDOW_SEC = 5 * 60;
const UNAUTH = { error: 'unauthorized' };
const NOT_CONFIGURED = {
  error: 'not_configured',
  message: 'Connect Firebase / Gemini / Razorpay env vars for live APIs. The shop is using the local catalog fallback.',
};

function setAuthHeaders(res, setCookie) {
  res.set('Cache-Control', 'private, no-store');
  if (setCookie) res.set('Set-Cookie', setCookie);
}

function authJson(res, data, status, setCookie) {
  setAuthHeaders(res, setCookie);
  return json(res, data, status);
}

function unauthorized(res) {
  return authJson(res, UNAUTH, 401);
}

function notConfigured(res) {
  return json(res, NOT_CONFIGURED, 501);
}

function sessionSetCookie(value) {
  return [
    `${SESSION_COOKIE}=${value}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    `Max-Age=${Math.floor(SESSION_EXPIRES_MS / 1000)}`,
  ].join('; ');
}

function sessionClearCookie() {
  return [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    'Max-Age=0',
  ].join('; ');
}

function readSessionCookie(req) {
  const header = String(req.headers.cookie || req.get?.('cookie') || '');
  const parts = header.split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const name = part.slice(0, idx).trim();
    if (name !== SESSION_COOKIE) continue;
    return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return '';
}

function authTimeIsFresh(decoded) {
  const authTime = Number(decoded?.auth_time);
  if (!Number.isFinite(authTime)) return false;
  return (Date.now() / 1000 - authTime) <= AUTH_WINDOW_SEC;
}

async function requireAdminSession(req, res) {
  const auth = await adminAuth();
  if (!auth) {
    notConfigured(res);
    return null;
  }
  const cookie = readSessionCookie(req);
  if (!cookie) {
    unauthorized(res);
    return null;
  }
  try {
    const decoded = await auth.verifySessionCookie(cookie, true);
    if (decoded.admin !== true) {
      unauthorized(res);
      return null;
    }
    return { decoded };
  } catch (err) {
    console.error('admin session verify failed', err?.code || 'verify_failed');
    unauthorized(res);
    return null;
  }
}

module.exports = {
  SESSION_COOKIE,
  SESSION_EXPIRES_MS,
  authJson,
  unauthorized,
  notConfigured,
  sessionSetCookie,
  sessionClearCookie,
  readSessionCookie,
  authTimeIsFresh,
  requireAdminSession,
};
