import { json, notConfigured } from './http.js';
import { adminAuth } from './firebaseAdmin.js';

export const SESSION_COOKIE = '__session';
export const SESSION_EXPIRES_MS = 60 * 60 * 1000;
const AUTH_WINDOW_SEC = 5 * 60;
const UNAUTH = { error: 'unauthorized' };

export function authJson(data, status, setCookie) {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'private, no-store',
    'Netlify-Vary': `cookie=${SESSION_COOKIE}`,
  };
  if (setCookie) headers['Set-Cookie'] = setCookie;
  return new Response(JSON.stringify(data), { status, headers });
}

export function unauthorized() {
  return authJson(UNAUTH, 401);
}

export function sessionSetCookie(value) {
  return [
    `${SESSION_COOKIE}=${value}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    `Max-Age=${Math.floor(SESSION_EXPIRES_MS / 1000)}`,
  ].join('; ');
}

export function sessionClearCookie() {
  return [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    'Max-Age=0',
  ].join('; ');
}

export function readSessionCookie(req, context) {
  const fromCtx = context?.cookies?.get?.(SESSION_COOKIE);
  if (fromCtx) return String(fromCtx);
  const header = req.headers.get('cookie') || '';
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

export function authTimeIsFresh(decoded) {
  const authTime = Number(decoded?.auth_time);
  if (!Number.isFinite(authTime)) return false;
  return (Date.now() / 1000 - authTime) <= AUTH_WINDOW_SEC;
}

export async function requireAdminSession(req, context) {
  const auth = await adminAuth();
  if (!auth) return notConfigured();
  const cookie = readSessionCookie(req, context);
  if (!cookie) return unauthorized();
  try {
    const decoded = await auth.verifySessionCookie(cookie, true);
    if (decoded.admin !== true) return unauthorized();
    return { decoded };
  } catch (err) {
    console.error('admin session verify failed', err?.code || 'verify_failed');
    return unauthorized();
  }
}
