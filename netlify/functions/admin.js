import { json, notConfigured } from './_shared/http.js';
import { adminDb } from './_shared/firebaseAdmin.js';
import { requireAdminSession } from './_shared/adminSession.js';

function toIso(value, fallback = new Date()) {
  if (!value) return fallback.toISOString();
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? fallback.toISOString() : d.toISOString();
}

function mapAdminOrder(id, data = {}) {
  const created = toIso(data.createdAt);
  return {
    orderId: data.orderId || id,
    createdAt: created,
    updatedAt: toIso(data.updatedAt, new Date(created)),
    recipientName: data.recipientName || data.customer?.name || data.shippingAddress?.name || '—',
    recipientPhone: data.recipientPhone || data.customer?.phone || data.shippingAddress?.phone || '',
    paymentMethod: data.paymentMethod || '',
    paymentStatus: data.paymentStatus || '',
    orderStatus: data.orderStatus || 'placed',
    total: Number(data.total ?? data.totals?.total) || 0,
    items: Array.isArray(data.items) ? data.items : [],
    statusHistory: Array.isArray(data.statusHistory) ? data.statusHistory : [],
    customer: data.customer || {},
  };
}

function mapProduct(id, data = {}) {
  const weightVariants = (data.weightVariants || data.variants || []).map((v) => ({
    weight: v.weight || v.w,
    price: Number(v.price) || 0,
    stock: typeof v.stock === 'number' ? v.stock : 20,
    sku: v.sku,
  }));
  const first = weightVariants[0];
  return {
    ...data,
    id: data.id || id,
    slug: data.slug || id,
    name: data.name,
    price: Number(data.price) || first?.price || 0,
    images: Array.isArray(data.images) ? data.images : (data.img ? [data.img] : []),
    weightVariants,
    isActive: data.isActive !== false,
    isDeleted: Boolean(data.isDeleted),
    bestseller: Boolean(data.bestseller || data.isBestseller),
    isBestseller: Boolean(data.bestseller || data.isBestseller),
  };
}

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function inRange(order, from, to) {
  const t = new Date(order.createdAt);
  const fromD = from ? new Date(from) : startOfDay();
  const toD = to ? new Date(to) : new Date();
  toD.setHours(23, 59, 59, 999);
  return t >= fromD && t <= toD;
}

function filterAdminOrders(orders, { status = 'all', from, to } = {}) {
  return orders
    .filter((o) => inRange(o, from, to))
    .filter((o) => !status || status === 'all' || o.orderStatus === status)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function stockCounts(products) {
  let inStock = 0;
  let outOfStock = 0;
  (products || []).forEach((p) => {
    const variants = p.weightVariants || [];
    if (!variants.length) {
      if (p.isActive !== false) inStock += 1;
      else outOfStock += 1;
      return;
    }
    variants.forEach((v) => {
      if ((v.stock ?? 0) > 0) inStock += 1;
      else outOfStock += 1;
    });
  });
  return { inStock, outOfStock };
}

function computeStats(orders, products, from, to) {
  const todayStart = startOfDay();
  const monthStart = startOfMonth();
  const ranged = filterAdminOrders(orders, { from, to });
  const paid = (o) => o.paymentStatus === 'paid';
  return {
    revenueToday: orders.filter((o) => paid(o) && new Date(o.createdAt) >= todayStart).reduce((s, o) => s + (o.total || 0), 0),
    revenueMonth: orders.filter((o) => paid(o) && new Date(o.createdAt) >= monthStart).reduce((s, o) => s + (o.total || 0), 0),
    totalOrders: ranged.length,
    pending: ranged.filter((o) => o.orderStatus === 'pending' || o.orderStatus === 'pending_cod' || o.paymentStatus === 'pending').length,
    ...stockCounts(products),
  };
}

function newOrderId() {
  const n = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SKF${n}${r}`.slice(0, 12);
}

function routeKey(pathname) {
  const p = String(pathname || '').replace(/\/$/, '');
  if (p.endsWith('/dashboard-stats')) return 'stats';
  if (p.endsWith('/search')) return 'search';
  if (p.endsWith('/orders/status')) return 'status';
  if (p.endsWith('/orders/create-manual')) return 'manual';
  if (p.endsWith('/products')) return 'products';
  if (p.endsWith('/orders')) return 'orders';
  return '';
}

async function loadOrders(db) {
  const snap = await db.collection('orders').get();
  return snap.docs.map((d) => mapAdminOrder(d.id, d.data() || {}));
}

async function loadProducts(db, { activeOnly = false, limit: cap } = {}) {
  const snap = await db.collection('products').get();
  let rows = snap.docs
    .map((d) => mapProduct(d.id, d.data() || {}))
    .filter((p) => !p.isDeleted && (!activeOnly || p.isActive !== false));
  if (cap) rows = rows.slice(0, cap);
  return rows;
}

async function handleOrders(req, url, db) {
  if (req.method !== 'GET') return json({ error: 'method' }, 405);
  const status = url.searchParams.get('status') || url.searchParams.get('orderStatus') || 'all';
  const from = url.searchParams.get('from') || undefined;
  const to = url.searchParams.get('to') || undefined;
  const cursor = url.searchParams.get('cursor') || '';
  const rawLimit = Number(url.searchParams.get('limit'));
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 500) : 200;
  let rows = filterAdminOrders(await loadOrders(db), { status, from, to });
  if (cursor) {
    const idx = rows.findIndex((o) => o.orderId === cursor);
    if (idx >= 0) rows = rows.slice(idx + 1);
  }
  return json(rows.slice(0, limit));
}

async function handleStatus(req, db, FieldValue) {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const body = await req.json().catch(() => ({}));
  const orderId = String(body.orderId || '').trim();
  const newStatus = String(body.orderStatus || body.status || body.newStatus || '').trim();
  if (!orderId || !newStatus) return json({ error: 'invalid_request' }, 400);

  const ref = db.collection('orders').doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) return json({ error: 'order_not_found' }, 404);
  const data = snap.data() || {};
  const history = Array.isArray(data.statusHistory) ? [...data.statusHistory] : [];
  history.push({
    status: newStatus,
    at: new Date().toISOString(),
    byAdmin: true,
    note: body.note || `Status changed to ${newStatus}`,
  });
  const patch = {
    orderStatus: newStatus,
    updatedAt: FieldValue.serverTimestamp(),
    statusHistory: history,
  };
  if (newStatus === 'delivered' && data.paymentMethod === 'cod') patch.paymentStatus = 'paid';
  await ref.update(patch);
  return json({ orderId, orderStatus: newStatus });
}

async function handleManual(req, db, FieldValue, decoded) {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const body = await req.json().catch(() => ({}));
  const orderId = newOrderId();
  const nowIso = new Date().toISOString();
  const isCod = body.paymentMethod === 'cod';
  const name = body.recipientName || 'Walk-in';
  const phone = body.recipientPhone || '';
  const total = Number(body.total) || 0;
  await db.collection('orders').doc(orderId).set({
    orderId,
    userId: decoded?.uid || null,
    source: 'admin-manual',
    customer: { name, phone, email: decoded?.email || null },
    recipientName: name,
    recipientPhone: phone,
    paymentMethod: body.paymentMethod || 'whatsapp',
    paymentStatus: isCod ? 'pending' : 'paid',
    orderStatus: isCod ? 'pending_cod' : 'confirmed',
    total,
    totals: { subtotal: total, discount: 0, gst: 0, shipping: 0, total },
    items: Array.isArray(body.items) ? body.items : [],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    statusHistory: [{ status: isCod ? 'pending_cod' : 'confirmed', at: nowIso, byAdmin: true, note: 'Manual order' }],
  });
  return json({ orderId });
}

async function handleStats(req, url, db) {
  if (req.method !== 'GET') return json({ error: 'method' }, 405);
  const from = url.searchParams.get('from') || undefined;
  const to = url.searchParams.get('to') || undefined;
  const [orders, products] = await Promise.all([loadOrders(db), loadProducts(db)]);
  return json(computeStats(orders, products, from, to));
}

async function handleSearch(req, url, db) {
  if (req.method !== 'GET') return json({ error: 'method' }, 405);
  const needle = String(url.searchParams.get('q') || url.searchParams.get('query') || '').trim().toLowerCase();
  if (!needle) return json({ orders: [], products: [], customers: [] });
  const [orders, products] = await Promise.all([loadOrders(db), loadProducts(db)]);
  const matchedOrders = orders.filter((o) => (
    String(o.orderId).toLowerCase().includes(needle)
    || String(o.recipientName).toLowerCase().includes(needle)
    || String(o.recipientPhone).toLowerCase().includes(needle)
  ));
  const matchedProducts = products.filter((p) => String(p.name || '').toLowerCase().includes(needle));
  const seen = new Set();
  const customers = [];
  matchedOrders.forEach((o) => {
    const key = o.recipientPhone || o.recipientName;
    if (!key || seen.has(key)) return;
    seen.add(key);
    customers.push({ name: o.recipientName, phone: o.recipientPhone });
  });
  return json({ orders: matchedOrders, products: matchedProducts, customers });
}

async function handleProducts(req, url, db) {
  if (req.method !== 'GET') return json({ error: 'method' }, 405);
  const activeOnly = url.searchParams.get('activeOnly') === 'true';
  const rawLimit = Number(url.searchParams.get('limit'));
  const cap = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : undefined;
  return json(await loadProducts(db, { activeOnly, limit: cap }));
}

export default async (req, context) => {
  const gate = await requireAdminSession(req, context);
  if (!gate?.decoded) return gate;

  const admin = await adminDb();
  if (!admin) return notConfigured();

  const url = new URL(req.url);
  switch (routeKey(url.pathname)) {
    case 'orders':
      return handleOrders(req, url, admin.db);
    case 'status':
      return handleStatus(req, admin.db, admin.FieldValue);
    case 'manual':
      return handleManual(req, admin.db, admin.FieldValue, gate.decoded);
    case 'stats':
      return handleStats(req, url, admin.db);
    case 'search':
      return handleSearch(req, url, admin.db);
    case 'products':
      return handleProducts(req, url, admin.db);
    default:
      return json({ error: 'not_found' }, 404);
  }
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
