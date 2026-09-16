const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { notifyOrderPlaced } = require('./notify');
const { notifyOwnerWhatsapp } = require('./notifyOwnerWhatsapp');

let cached = null;

function projectId() {
  return process.env.GCLOUD_PROJECT
    || process.env.GOOGLE_CLOUD_PROJECT
    || process.env.FIREBASE_PROJECT_ID
    || 'sukhmal-website';
}

function serviceAccountPath() {
  const fromEnv = String(process.env.GOOGLE_APPLICATION_CREDENTIALS || '').trim();
  const candidates = [
    fromEnv,
    fromEnv ? path.resolve(process.cwd(), fromEnv) : '',
    path.resolve(__dirname, '../../serviceAccountKey.json'),
  ].filter(Boolean);
  return candidates.find((file) => fs.existsSync(file)) || '';
}

async function adminDb() {
  if (cached) return cached;
  try {
    if (!admin.apps.length) {
      const saPath = serviceAccountPath();
      if (saPath) {
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(fs.readFileSync(saPath, 'utf8'))),
          projectId: projectId(),
        });
      } else {
        admin.initializeApp({ projectId: projectId() });
      }
    }
    cached = { db: getFirestore('default'), FieldValue, auth: getAuth() };
    return cached;
  } catch (err) {
    console.error('firebase-admin unavailable', err?.message);
    return null;
  }
}

async function adminAuth() {
  const sdk = await adminDb();
  return sdk?.auth || null;
}

function orderAmountPaise(data = {}) {
  const items = Array.isArray(data.items) ? data.items : [];
  const subtotal = items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 0), 0);
  const shipping = Number(data.totals?.shipping || 0);
  const gst = Number(data.totals?.gst || 0);
  const discount = Number(data.totals?.discount || 0);
  return Math.round((subtotal - discount + gst + shipping) * 100);
}

async function confirmOrderPayment(orderId, extra = {}) {
  const sdk = await adminDb();
  if (!sdk || !orderId) return { updated: false };
  const ref = sdk.db.collection('orders').doc(orderId);
  const result = { updated: false, alreadyPaid: false };

  await sdk.db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const data = snap.data() || {};
    if (data.paymentMethod === 'cod') return;
    if (data.paymentStatus === 'paid') {
      result.alreadyPaid = true;
      result.order = { ...data, orderId: data.orderId || orderId };
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
      const pref = sdk.db.collection('products').doc(id);
      productReads.push({ id, ref: pref, snap: await tx.get(pref), qty: qtyById[id] });
    }

    const history = Array.isArray(data.statusHistory) ? [...data.statusHistory] : [];
    history.push({
      status: 'Confirmed',
      at: new Date().toISOString(),
      byAdmin: false,
      note: 'Razorpay signature verified',
    });

    tx.update(ref, {
      ...extra,
      paymentStatus: 'paid',
      status: 'Confirmed',
      orderStatus: 'confirmed',
      stockDecremented: true,
      updatedAt: sdk.FieldValue.serverTimestamp(),
      statusHistory: history,
    });

    if (!data.stockDecremented) {
      for (const row of productReads) {
        if (!row.snap.exists) continue;
        const stock = Number(row.snap.data().stock);
        if (!Number.isFinite(stock)) continue;
        tx.update(row.ref, {
          stock: Math.max(0, stock - row.qty),
          updatedAt: sdk.FieldValue.serverTimestamp(),
        });
      }
    }
    result.updated = true;
    result.order = { ...data, orderId: data.orderId || orderId };
  });

  const needsMail = Boolean(result.order) && (
    result.updated === true || result.order.emailsSent?.customer !== true
  );
  if (needsMail) {
    const email = pickEmail(
      result.order.email,
      result.order.customer?.email,
      result.order.shippingAddress?.email,
    );
    result.order = {
      ...result.order,
      email,
      customer: { ...(result.order.customer || {}), email },
    };
    const notify = await notifyOrderPlaced(result.order);
    await markOrderEmailsSent(result.order.orderId, notify);
    result.notify = notify;
    if (result.updated === true) {
      try {
        await notifyOwnerWhatsapp(result.order);
      } catch (err) {
        console.error('owner whatsapp ignored', result.order.orderId, err?.message);
      }
    }
  }

  return result;
}

function pickEmail(...values) {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const value of values) {
    const email = String(value || '').trim().toLowerCase();
    if (EMAIL_RE.test(email)) return email;
  }
  return '';
}

async function claimCodOrderEmails(order = {}) {
  const sdk = await adminDb();
  const orderId = order.orderId;
  if (!sdk || !orderId) return { claimed: false, order };
  const ref = sdk.db.collection('orders').doc(orderId);
  let claimed = false;
  let payload = order;
  await sdk.db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      const email = pickEmail(order.email, order.customer?.email, order.shippingAddress?.email);
      payload = { ...order, orderId, email, customer: { ...(order.customer || {}), email } };
      claimed = Boolean(email || orderId);
      return;
    }
    const data = snap.data() || {};
    const email = pickEmail(
      order.email,
      order.customer?.email,
      data.email,
      data.customer?.email,
      data.shippingAddress?.email,
    );
    payload = {
      ...order,
      ...data,
      orderId: data.orderId || orderId,
      email,
      customer: {
        ...(data.customer || {}),
        ...(order.customer || {}),
        email,
      },
      shippingAddress: { ...(data.shippingAddress || {}), ...(order.shippingAddress || {}) },
      items: Array.isArray(data.items) && data.items.length ? data.items : (order.items || []),
      totals: { ...(order.totals || {}), ...(data.totals || {}) },
    };
    if (data.emailsSent?.customer === true) return;
    claimed = true;
  });
  return { claimed, order: payload };
}

async function markOrderEmailsSent(orderId, notify = {}) {
  const sdk = await adminDb();
  if (!sdk || !orderId) return;
  try {
    await sdk.db.collection('orders').doc(orderId).set({
      emailsSentAt: sdk.FieldValue.serverTimestamp(),
      emailsSent: {
        owner: Boolean(notify.ownerNotified),
        customer: Boolean(notify.customerNotified),
      },
    }, { merge: true });
  } catch (err) {
    console.error('markOrderEmailsSent failed', orderId, err?.message);
  }
}

module.exports = { adminDb, adminAuth, orderAmountPaise, confirmOrderPayment, claimCodOrderEmails, markOrderEmailsSent, pickEmail };
