import { adminAuth } from './_shared/firebaseAdmin.js';
import { json, notConfigured } from './_shared/http.js';
import {
  authJson,
  authTimeIsFresh,
  sessionSetCookie,
  unauthorized,
} from './_shared/adminSession.js';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  const body = await req.json().catch(() => null);
  const idToken = typeof body?.idToken === 'string' ? body.idToken.trim() : '';
  if (!idToken) return json({ error: 'invalid_request' }, 400);

  const auth = await adminAuth();
  if (!auth) return notConfigured();

  let decoded;
  try {
    decoded = await auth.verifyIdToken(idToken);
  } catch (err) {
    console.error('admin session token verify failed', err?.code || 'verify_failed');
    return unauthorized();
  }

  if (decoded.admin !== true) return authJson({ error: 'forbidden' }, 403);
  if (!authTimeIsFresh(decoded)) return unauthorized();

  let sessionCookie;
  try {
    sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: 60 * 60 * 1000 });
  } catch (err) {
    console.error('admin session cookie mint failed', err?.code || 'mint_failed');
    return unauthorized();
  }

  return authJson({ ok: true, expiresIn: 60 * 60 }, 200, sessionSetCookie(sessionCookie));
};

export const config = { path: '/api/create-admin-session' };
