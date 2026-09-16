import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { stripHtml } from '@/lib/security';
import { firestoreSafeMediaUrl, persistOrderItemImage } from '@/lib/orderImages';
import { estimateDeliveryByPincode } from '@/lib/deliveryEstimate';
import { canonicalStatus, courierTrackingUrl, ORDER_STATUSES, statusIndex, statusSlug } from '@/lib/orderStatus';

export const ORDER_FLOW = ORDER_STATUSES;

export function newOrderId() {
  const n = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SKF${n}${r}`.slice(0, 12);
}

export function etaWindow(from = new Date(), pincode = '') {
  const estimate = estimateDeliveryByPincode(pincode, from);
  return {
    start: estimate.start,
    end: estimate.end,
    label: estimate.label,
    window: estimate.window,
    detail: estimate.detail,
  };
}

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatWhen(value) {
  const d = toDate(value);
  if (!d) return '';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDay(value) {
  const d = toDate(value);
  if (!d) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Normalize admin/legacy statuses onto the public tracking ladder. */
export function normalizeTrackStatus(raw) {
  return statusSlug(raw);
}

export function accountStatus(raw) {
  const s = String(raw || '').toLowerCase();
  if (s === 'cancelled') return 'cancelled';
  if (s === 'delivered') return 'delivered';
  if (s === 'shipped' || s === 'dispatched' || s === 'ofd' || s === 'out_for_delivery') return 'shipped';
  return 'processing';
}

function historyStamp(status, at) {
  return { status, at: at || new Date().toISOString(), byAdmin: false };
}

export async function createCustomerOrder({
  user,
  items,
  address,
  totals,
  paymentMethod,
  giftMsg,
  deliveryDate,
  customDate,
  coupon,
}) {
  const isCod = paymentMethod === 'cod';
  const orderId = newOrderId();
  const estimate = estimateDeliveryByPincode(address?.pincode);
  const eta = etaWindow(new Date(), address?.pincode);
  const nowIso = new Date().toISOString();
  const status = isCod ? 'Confirmed' : 'Placed';
  const lineItems = (items || []).map((it) => ({
    key: it.key || `${it.id}-${it.variant || ''}`,
    productId: it.id,
    slug: it.slug || null,
    name: it.name,
    image: persistOrderItemImage(it),
    source: it.source || it.meta?.type || 'product',
    meta: it.meta ? {
      type: it.meta.type || null,
      style: it.meta.style || null,
      previewImageUrl: firestoreSafeMediaUrl(it.meta.previewImageUrl),
    } : null,
    price: Number(it.price) || 0,
    qty: Number(it.qty) || 1,
    variant: it.variant || it.weight || null,
  }));
  const payload = {
    orderId,
    userId: user?.uid || null,
    email: user?.email || address?.email || null,
    customer: {
      name: stripHtml(user?.displayName || address?.name || '', 80),
      email: user?.email || address?.email || null,
      phone: user?.phone || address?.phone || null,
    },
    shippingAddress: address ? {
      ...address,
      name: stripHtml(address.name, 80),
      phone: String(address.phone || '').replace(/\D/g, '').slice(-10),
      line1: stripHtml(address.line1, 200),
      line2: stripHtml(address.line2, 200),
      pincode: String(address.pincode || '').replace(/\D/g, '').slice(0, 6),
    } : null,
    items: lineItems,
    totals: {
      subtotal: Number(totals?.subtotal) || 0,
      discount: Number(totals?.discount) || 0,
      gst: Number(totals?.gst) || 0,
      shipping: Number(totals?.shipping) || 0,
      total: Number(totals?.total) || 0,
    },
    total: Number(totals?.total) || 0,
    paymentMethod: isCod ? 'cod' : 'razorpay',
    paymentStatus: 'pending',
    status,
    orderStatus: statusSlug(status),
    estimatedDeliveryDate: estimate.estimatedDeliveryDate,
    estimatedDeliveryWindow: estimate.window,
    trackingNumber: null,
    courierName: null,
    giftMsg: giftMsg ? {
      name: stripHtml(giftMsg.name, 80),
      phone: String(giftMsg.phone || '').replace(/\D/g, '').slice(-10),
      text: stripHtml(giftMsg.text, 500),
    } : null,
    isDeleted: false,
    deliveryDate: deliveryDate || null,
    customDate: customDate || null,
    coupon: coupon || null,
    eta: eta.label,
    etaStart: eta.start,
    etaEnd: eta.end,
    razorpayOrderId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    statusHistory: [
      historyStamp(status, nowIso),
    ],
  };

  if (!db || !user?.uid) {
    throw new Error('Sign in is required to place an order. We could not save it to your account.');
  }
  await setDoc(doc(db, 'orders', orderId), payload);

  return { ...payload, createdAt: nowIso, updatedAt: nowIso };
}

export async function attachRazorpayOrderId(orderId, razorpayOrderId) {
  if (!db || !orderId || !razorpayOrderId) return;
  await updateDoc(doc(db, 'orders', orderId), {
    razorpayOrderId,
    updatedAt: serverTimestamp(),
  });
}

export function mapAdminOrder(id, data = {}) {
  const created = toDate(data.createdAt) || new Date();
  return {
    orderId: data.orderId || id,
    createdAt: created.toISOString(),
    updatedAt: (toDate(data.updatedAt) || created).toISOString(),
    recipientName: data.recipientName || data.customer?.name || data.shippingAddress?.name || '—',
    recipientPhone: data.recipientPhone || data.customer?.phone || data.shippingAddress?.phone || '',
    paymentMethod: data.paymentMethod || '',
    paymentStatus: data.paymentStatus || '',
    status: canonicalStatus(data.status || data.orderStatus),
    orderStatus: statusSlug(data.status || data.orderStatus || 'placed'),
    estimatedDeliveryDate: data.estimatedDeliveryDate || data.eta || '',
    trackingNumber: data.trackingNumber || '',
    courierName: data.courierName || '',
    total: Number(data.total ?? data.totals?.total) || 0,
    items: Array.isArray(data.items) ? data.items : [],
    statusHistory: Array.isArray(data.statusHistory) ? data.statusHistory : [],
    customer: data.customer || {},
  };
}

export function mapOrderDoc(id, data) {
  const created = toDate(data.createdAt) || new Date();
  const items = Array.isArray(data.items) ? data.items : [];
  const first = items[0] || {};
  const history = Array.isArray(data.statusHistory) ? data.statusHistory : [];
  const currentStatus = canonicalStatus(data.status || data.orderStatus);
  const track = statusSlug(currentStatus);
  const currentIdx = statusIndex(currentStatus);
  const stepTimes = {};
  history.forEach((h) => {
    const key = statusSlug(h.status);
    if (key && !stepTimes[key]) stepTimes[key] = formatWhen(h.at);
  });
  if (!stepTimes.placed) stepTimes.placed = formatWhen(created);
  const timeline = [...history]
    .sort((a, b) => new Date(a.at) - new Date(b.at))
    .map((h, i, arr) => ({
      title: canonicalStatus(h.status),
      at: formatWhen(h.at),
      text: h.note || `Status updated to ${canonicalStatus(h.status)}.`,
      current: i === arr.length - 1,
    }))
    .reverse();

  const uiTimeline = ORDER_STATUSES.map((label, i) => ({
    label,
    at: stepTimes[statusSlug(label)] || (i === 0 ? formatWhen(created) : '—'),
    done: currentStatus !== 'Cancelled' && currentIdx >= i,
  }));

  const trackingNumber = data.trackingNumber || '';
  const courierName = data.courierName || '';
  const estimate = data.estimatedDeliveryDate || data.eta || formatDay(data.etaEnd);
  const pincodeGuess = estimateDeliveryByPincode(data.shippingAddress?.pincode);

  return {
    id: data.orderId || id,
    docId: id,
    date: formatDay(created),
    placedAt: formatWhen(created),
    total: Number(data.total ?? data.totals?.total) || 0,
    status: accountStatus(data.status || data.orderStatus),
    orderStatus: statusSlug(currentStatus),
    fulfillmentStatus: currentStatus,
    paymentStatus: data.paymentStatus,
    paymentMethod: data.paymentMethod,
    items: items.reduce((n, it) => n + (Number(it.qty) || 1), 0),
    title: first.name || 'Order',
    image: first.image || '/brand/hero-luxury-hamper-v2.png',
    lines: items.map((it) => ({
      name: it.name,
      qty: it.qty,
      weight: it.variant || '',
      price: it.price,
      image: it.image,
      id: it.productId || it.id,
      slug: it.slug,
      source: it.source || it.meta?.type || '',
      meta: it.meta || null,
    })),
    timeline: uiTimeline,
    address: data.shippingAddress || {},
    summary: {
      subtotal: Number(data.totals?.subtotal) || 0,
      shipping: Number(data.totals?.shipping) || 0,
      discount: Number(data.totals?.discount) || 0,
      gst: Number(data.totals?.gst) || 0,
      paid: data.paymentStatus === 'paid' ? Number(data.total ?? data.totals?.total) || 0 : 0,
    },
    eta: estimate,
    estimatedDeliveryDate: estimate,
    estimatedDeliveryWindow: pincodeGuess.window,
    trackingNumber,
    courierName,
    customer: data.customer || {},
    track: {
      id: data.orderId || id,
      placedOn: formatDay(created),
      placedTime: created.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
      recipient: data.shippingAddress?.name || data.customer?.name || '',
      paymentStatus: data.paymentStatus === 'paid' ? 'Paid Successfully' : (data.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Pending payment'),
      amount: Number(data.total ?? data.totals?.total) || 0,
      status: track === 'cancelled' ? 'placed' : track,
      fulfillmentStatus: currentStatus,
      stepTimes,
      etaDate: estimate,
      etaTime: pincodeGuess.detail,
      onTime: currentStatus !== 'Delivered' ? true : true,
      trackingNumber,
      courierName: courierName || (trackingNumber ? 'DTDC' : ''),
      trackingUrl: courierTrackingUrl(courierName, trackingNumber),
      partner: {
        name: courierName || (trackingNumber ? 'DTDC' : 'Assigned after dispatch'),
        tracking: trackingNumber || '—',
        trackingUrl: courierTrackingUrl(courierName || 'DTDC', trackingNumber),
        support: data.customer?.phone || '',
        hours: 'Mon – Sat | 9 AM – 7 PM',
      },
      timeline: timeline.length ? timeline : [{
        title: 'Order placed',
        at: formatWhen(created),
        text: 'We have received your order.',
        current: true,
      }],
    },
    raw: data,
  };
}

export async function getOrderById(orderId) {
  if (!db || !orderId) return null;
  const id = String(orderId).trim();
  const snap = await getDoc(doc(db, 'orders', id));
  if (snap.exists()) return mapOrderDoc(snap.id, snap.data());
  return null;
}

export function subscribeUserOrders(uid, onChange, onError) {
  if (!db || !uid) {
    onChange([]);
    return () => {};
  }
  let unsub = () => {};
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc'),
  );
  unsub = onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => mapOrderDoc(d.id, d.data()))),
    () => {
      const fallback = query(collection(db, 'orders'), where('userId', '==', uid));
      unsub = onSnapshot(fallback, (snap) => {
        const rows = snap.docs.map((d) => mapOrderDoc(d.id, d.data()));
        rows.sort((a, b) => String(b.placedAt).localeCompare(String(a.placedAt)));
        onChange(rows);
      }, onError);
    },
  );
  return () => unsub();
}

export function subscribeUserDoc(uid, onChange, onError) {
  if (!db || !uid) {
    onChange(null);
    return () => {};
  }
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    onChange(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  }, onError);
}

export async function saveUserAddresses(uid, addresses) {
  if (!db || !uid) return;
  const clean = (addresses || []).map((a) => ({
    ...a,
    name: stripHtml(a.name, 80),
    phone: String(a.phone || '').replace(/\D/g, '').slice(-10),
    line1: stripHtml(a.line1, 200),
    line2: stripHtml(a.line2, 200),
    pincode: String(a.pincode || '').replace(/\D/g, '').slice(0, 6),
  }));
  await setDoc(doc(db, 'users', uid), {
    addresses: clean,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function saveUserProfile(uid, fields) {
  if (!db || !uid) return;
  const blocked = new Set(['role', 'loyaltyPoints', 'admin', 'isAdmin', 'customClaims']);
  const safe = Object.fromEntries(
    Object.entries(fields || {}).filter(([key]) => !blocked.has(key)),
  );
  await setDoc(doc(db, 'users', uid), {
    ...safe,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function appendOrderStatus(orderId, newStatus, extra = {}) {
  if (!db || !orderId) return;
  const ref = doc(db, 'orders', orderId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Order not found');
  const data = snap.data();
  const status = canonicalStatus(newStatus);
  const entry = {
    status,
    at: new Date().toISOString(),
    byAdmin: true,
    note: extra.note || `Status changed to ${status}`,
  };
  const patch = {
    status,
    orderStatus: statusSlug(status),
    updatedAt: serverTimestamp(),
    statusHistory: [...(data.statusHistory || []), entry],
    ...(status === 'Delivered' && data.paymentMethod === 'cod' ? { paymentStatus: 'paid' } : {}),
  };
  if (extra.trackingNumber !== undefined) patch.trackingNumber = String(extra.trackingNumber || '').trim() || null;
  if (extra.courierName !== undefined) patch.courierName = String(extra.courierName || '').trim() || null;
  await updateDoc(ref, patch);
}
