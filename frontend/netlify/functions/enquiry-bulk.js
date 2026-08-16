import { json } from './_shared/http.js';
import { adminDb } from './_shared/firebaseAdmin.js';

function strip(value, max) {
  return String(value || '').replace(/<[^>]*>/g, '').replace(/[<>]/g, '').trim().slice(0, max);
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const body = await req.json().catch(() => ({}));
  const digits = String(body.phone || '').replace(/\D/g, '');
  const phone = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits.slice(-10);
  if (!/^[6-9]\d{9}$/.test(phone)) return json({ error: 'invalid_phone' }, 400);
  const email = strip(body.email, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'invalid_email' }, 400);

  const row = {
    companyName: strip(body.company || body.companyName, 120),
    name: strip(body.name, 80),
    contact: strip(body.name || body.contact, 80),
    phone,
    email,
    quantity: strip(body.qty || body.quantity, 40),
    occasion: strip(body.occasion, 80),
    notes: strip(body.notes, 500),
    budget: strip(body.budget, 40),
    status: 'new',
  };

  const admin = await adminDb();
  if (admin) {
    await admin.db.collection('bulkInquiries').add({
      ...row,
      createdAt: admin.FieldValue.serverTimestamp(),
    });
  }
  return json({ ok: true });
};

export const config = { path: '/api/enquiry/bulk' };
