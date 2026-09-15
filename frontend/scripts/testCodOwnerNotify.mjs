/**
 * Local proof: COD owner-notify (Resend + CallMeBot) with no Razorpay.
 * Usage from frontend/: node scripts/testCodOwnerNotify.mjs
 *
 * Prefers the local CRA `/api/create-order` path when `npm start` is running.
 * Otherwise calls CallMeBot directly so you can test WhatsApp with no payment.
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const require = createRequire(import.meta.url);
const { notifyOwnerWhatsapp } = require('../../firebase/http-functions/_shared/notifyOwnerWhatsapp.js');

const ORDER_ID = `SKFTEST${Date.now().toString(36).toUpperCase()}`.slice(0, 12);

function dummyOrder() {
  return {
    orderId: ORDER_ID,
    customer: {
      name: 'COD Notify Test',
      email: process.env.ADMIN_NOTIFY_EMAIL || null,
      phone: '8595321912',
    },
    shippingAddress: {
      name: 'COD Notify Test',
      phone: '8595321912',
      line1: 'Test',
      line2: 'Delhi',
      pincode: '110001',
    },
    items: [{ productId: 'test-almonds', name: 'Test Almonds 250g', qty: 1, price: 499 }],
    totals: { subtotal: 499, discount: 0, gst: 25, shipping: 0, total: 524 },
    total: 524,
    paymentMethod: 'cod',
    eta: '2–4 business days',
  };
}

async function writeFirestoreOrder(order) {
  const { initializeApp, getApps, applicationDefault, cert } = await import('firebase-admin/app');
  const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
  const { existsSync, readFileSync } = await import('node:fs');
  const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'sukhmal-website';
  const saPath = path.resolve(__dirname, '../../firebase/serviceAccountKey.json');
  if (!getApps().length) {
    if (existsSync(saPath)) {
      initializeApp({
        credential: cert(JSON.parse(readFileSync(saPath, 'utf8'))),
        projectId,
      });
    } else {
      initializeApp({
        credential: applicationDefault(),
        projectId,
      });
    }
  }
  const db = getFirestore('default');
  const payload = {
    ...order,
    userId: 'cod-notify-test',
    paymentStatus: 'pending',
    orderStatus: 'confirmed',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await db.collection('orders').doc(ORDER_ID).set(payload);
  return payload;
}

function orderBody(order) {
  return {
    orderId: ORDER_ID,
    paymentMethod: 'cod',
    order: {
      orderId: ORDER_ID,
      customer: order.customer,
      shippingAddress: order.shippingAddress,
      items: order.items,
      totals: order.totals,
      total: order.total,
      paymentMethod: 'cod',
      eta: order.eta,
    },
  };
}

async function postCreateOrder(base, order) {
  const res = await fetch(`${base}/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderBody(order)),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  console.log('project', process.env.REACT_APP_FIREBASE_PROJECT_ID);
  console.log('notifyTo', process.env.ADMIN_NOTIFY_EMAIL);
  console.log('resendKey', process.env.RESEND_API_KEY ? `set len=${process.env.RESEND_API_KEY.length}` : 'MISSING');
  console.log('whatsappPhone', process.env.WHATSAPP_OWNER_PHONE ? 'set' : 'MISSING');
  console.log('callmebotKey', process.env.CALLMEBOT_API_KEY ? `set len=${process.env.CALLMEBOT_API_KEY.length}` : 'MISSING');
  console.log('orderId', ORDER_ID);

  const order = dummyOrder();
  try {
    await writeFirestoreOrder(order);
    console.log('firestoreWrite', 'ok');
  } catch (err) {
    console.log('firestoreWrite', 'FAILED', err?.message || String(err));
  }

  let httpReached = false;
  try {
    const result = await postCreateOrder('http://localhost:3000/api', order);
    httpReached = true;
    console.log('http', 'http://localhost:3000/api', JSON.stringify(result));
  } catch (err) {
    console.log('http', 'http://localhost:3000/api', 'UNREACHABLE', err?.message || String(err));
  }

  if (!httpReached) {
    const wa = await notifyOwnerWhatsapp(order);
    console.log('direct-whatsapp', JSON.stringify(wa));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
