const { json, readJsonBody, httpsFn } = require('../_shared/httpFn');
const { adminDb } = require('../_shared/firebaseAdmin');

const trackOrder = httpsFn(async (req, res) => {
  if (req.method !== 'POST') return json(res, { error: 'method' }, 405);
  const body = readJsonBody(req);
  const orderId = String(body.orderId || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!orderId || orderId.length > 24) return json(res, { error: 'invalid_order' }, 400);

  const admin = await adminDb();
  if (!admin) return json(res, { error: 'not_configured' }, 501);
  const snap = await admin.db.collection('orders').doc(orderId).get();
  if (!snap.exists || snap.data()?.isDeleted === true) return json(res, { error: 'not_found' }, 404);

  const data = snap.data() || {};
  const created = data.createdAt?.toDate?.() || (data.createdAt ? new Date(data.createdAt) : new Date());
  return json(res, {
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
});

module.exports = { trackOrder };
