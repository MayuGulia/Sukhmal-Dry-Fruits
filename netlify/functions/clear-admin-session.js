import { json } from './_shared/http.js';
import { authJson, sessionClearCookie } from './_shared/adminSession.js';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  return authJson({ ok: true }, 200, sessionClearCookie());
};

export const config = { path: '/api/clear-admin-session' };
