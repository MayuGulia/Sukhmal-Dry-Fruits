import { json } from './_shared/http.js';
import { adminDb } from './_shared/firebaseAdmin.js';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const body = await req.json().catch(() => ({}));
  const orderId = String(body.orderId || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!orderId || orderId.length > 24) return json({ error: 'invalid_order' }, 400);

  const admin = await adminDb();
  if (!admin) return json({ error: 'not_configured' }, 501);
  const snap = await admin.db.collection('orders').doc(orderId).get();
  if (!snap.exists || snap.data()?.isDeleted === true) return json({ error: 'not_found' }, 404);

  const data = snap.data() || {};
  const created = data.createdAt?.toDate?.() || (data.createdAt ? new Date(data.createdAt) : new Date());
  return json({
    id: snap.id,
    data: {
      orderId: data.orderId || snap.id,
      createdAt: created.toISOString(),
      items: Array.isArray(data.items) ? data.items : [],
      totals: data.totals || {},
      total: data.total || 0,
      orderStatus: data.orderStatus,
      paymentStatus: data.paymentStatus,
      paymentMethod: data.paymentMethod,
      shippingAddress: {
        name: data.shippingAddress?.name || '',
        pincode: data.shippingAddress?.pincode || '',
        line1: data.shippingAddress?.line1 || '',
      },
      customer: { name: data.customer?.name || '' },
      statusHistory: Array.isArray(data.statusHistory) ? data.statusHistory : [],
      eta: data.eta || '',
    },
  });
};

export const config = { path: '/api/track-order' };
