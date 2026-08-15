import { json, notConfigured, env } from './_shared/http.js';

export default async (req) => {
  const url = new URL(req.url);
  if (!env('FIREBASE_ADMIN_PRIVATE_KEY')) return notConfigured();
  return json({ path: url.pathname, ok: false, note: 'Admin SDK session cookie (1h) + custom claim admin:true required.' }, 501);
};

export const config = {
  path: [
    '/api/admin/dashboard-stats',
    '/api/admin/search',
    '/api/admin/orders',
    '/api/admin/orders/status',
    '/api/admin/orders/create-manual',
    '/api/admin/products',
  ],
};
