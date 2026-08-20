import { env } from './http.js';
import { sendResend, ownerNotifyTo, ownerOrderHtml } from './notify.js';

let cached = null;

export async function adminDb() {
  if (cached) return cached;
  const pk = env('FIREBASE_ADMIN_PRIVATE_KEY');
  const email = env('FIREBASE_ADMIN_CLIENT_EMAIL');
  const projectId = env('FIREBASE_PROJECT_ID') || env('REACT_APP_FIREBASE_PROJECT_ID') || 'sukhmal';
  try {
    const { initializeApp, getApps, cert } = await import('firebase-admin/app');
    const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
    const { getAuth } = await import('firebase-admin/auth');
    if (!getApps().length) {
      if (pk && email) {
        initializeApp({
          credential: cert({
            projectId,
            clientEmail: email,
            privateKey: pk.replace(/\\n/g, '\n'),
          }),
        });
      } else {
        initializeApp({ projectId: 'sukhmal' });
      }
    }
    cached = { db: getFirestore('default'), FieldValue, auth: getAuth() };
    return cached;
  } catch (err) {
    console.error('firebase-admin unavailable', err?.message);
    return null;
  }
}

export async function adminAuth() {
  const admin = await adminDb();
  return admin?.auth || null;
}

export function orderAmountPaise(data = {}) {
  const items = Array.isArray(data.items) ? data.items : [];
  const subtotal = items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 0), 0);
  const shipping = Number(data.totals?.shipping || 0);
  const gst = Number(data.totals?.gst || 0);
  const discount = Number(data.totals?.discount || 0);
  return Math.round((subtotal - discount + gst + shipping) * 100);
}

export async function confirmOrderPayment(orderId, extra = {}) {
  const admin = await adminDb();
  if (!admin || !orderId) return { updated: false };
  const ref = admin.db.collection('orders').doc(orderId);
  const result = { updated: false, alreadyPaid: false };

  await admin.db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const data = snap.data() || {};
    if (data.paymentMethod === 'cod') return;
    if (data.paymentStatus === 'paid') {
      result.alreadyPaid = true;
      return;
    }

    const items = Array.isArray(data.items) ? data.items : [];
    const qtyById = {};
    for (const it of items) {
      const id = String(it.productId || it.id || '').trim();
      if (!id) continue;
      qtyById[id] = (qtyById[id] || 0) + (Number(it.qty) || 0);
    }
    const productReads = [];
    for (const id of Object.keys(qtyById)) {
      const pref = admin.db.collection('products').doc(id);
      productReads.push({ id, ref: pref, snap: await tx.get(pref), qty: qtyById[id] });
    }

    const history = Array.isArray(data.statusHistory) ? [...data.statusHistory] : [];
    history.push({
      status: 'confirmed',
      at: new Date().toISOString(),
      byAdmin: false,
      note: 'Razorpay signature verified',
    });

    tx.update(ref, {
      paymentStatus: 'paid',
      orderStatus: 'confirmed',
      stockDecremented: true,
      updatedAt: admin.FieldValue.serverTimestamp(),
      statusHistory: history,
      ...extra,
    });

    if (!data.stockDecremented) {
      for (const row of productReads) {
        if (!row.snap.exists) continue;
        const stock = Number(row.snap.data().stock);
        if (!Number.isFinite(stock)) continue;
        tx.update(row.ref, {
          stock: Math.max(0, stock - row.qty),
          updatedAt: admin.FieldValue.serverTimestamp(),
        });
      }
    }
    result.updated = true;
    result.order = { ...data, orderId: data.orderId || orderId };
  });

  if (result.updated === true && result.order) {
    const order = result.order;
    const sent = await sendResend({
      to: ownerNotifyTo(),
      subject: `New order ${order.orderId}`,
      html: ownerOrderHtml(order),
    });
    if (!sent?.ok) {
      console.error('owner order email failed', order.orderId, sent);
    }
  }

  return result;
}
