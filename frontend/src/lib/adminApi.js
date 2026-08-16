import { aiApi } from '@/lib/api';
import {
  applyPreview,
  savePreview,
  updatePreviewChanges,
  compactInventoryCatalog,
  patchProductWithChanges,
  normalizeProduct,
  getLiveProducts,
} from '@/lib/commerceStore';
import { PRODUCTS as MOCK_PRODUCTS } from '@/data/mockCatalog';
import { auth, db } from '@/lib/firebase';
import { hydrateStorefrontProduct } from '@/lib/liveCatalog';
import { appendOrderStatus, mapAdminOrder, newOrderId } from '@/lib/orders';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

function friendlyFsError(err, fallback) {
  const code = err?.code || '';
  if (code === 'permission-denied') {
    return 'Firestore blocked this request. Deploy firebase/firestore.rules to sukhmal-website and stay signed in as sukhmaldryfruitskorner2@gmail.com.';
  }
  return err?.message || fallback;
}

function catalogFallback({ activeOnly = false, limit: cap } = {}) {
  let rows = getLiveProducts({ activeOnly: false });
  if (!rows.length) rows = MOCK_PRODUCTS.map((p) => hydrateStorefrontProduct(p.id, p));
  rows = rows.filter((p) => !p.isDeleted && (!activeOnly || p.isActive !== false));
  if (cap) rows = rows.slice(0, cap);
  return rows;
}

function apiError(err, fallback) {
  const status = err?.response?.status;
  const data = err?.response?.data;
  let msg = data?.message || data?.error || err?.message || fallback;
  if (status === 404) {
    msg = 'AI preview endpoint was not found. Restart the frontend so the Gemini route can load, then try again.';
  }
  const error = new Error(typeof msg === 'string' ? msg : fallback);
  error.status = status;
  error.code = data?.error;
  throw error;
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

async function listFirestoreOrders() {
  if (!db) return [];
  const snap = await getDocs(collection(db, 'orders'));
  return snap.docs.map((d) => mapAdminOrder(d.id, d.data()));
}

async function listFirestoreProducts({ activeOnly = false, limit: cap } = {}) {
  if (!db) return catalogFallback({ activeOnly, limit: cap });
  try {
    const snap = await getDocs(collection(db, 'products'));
    let rows = snap.docs
      .map((d) => hydrateStorefrontProduct(d.id, d.data()))
      .filter((p) => !p.isDeleted && (!activeOnly || p.isActive !== false));
    if (cap) rows = rows.slice(0, cap);
    return rows;
  } catch {
    return catalogFallback({ activeOnly, limit: cap });
  }
}

function productDocForFirestore(p) {
  const n = normalizeProduct(p);
  return JSON.parse(JSON.stringify({
    id: n.id,
    slug: n.slug,
    name: n.name,
    category: n.category || '',
    subcategory: n.subcategory || '',
    tagline: n.tagline || '',
    description: n.description || '',
    price: Number(n.price) || 0,
    mrp: n.mrp || null,
    images: n.images || (n.img ? [n.img] : []),
    weightVariants: n.weightVariants || [],
    variants: n.variants || [],
    bestseller: Boolean(n.bestseller || n.isBestseller),
    isBestseller: Boolean(n.bestseller || n.isBestseller),
    isActive: n.isActive !== false,
    isDeleted: false,
    sku: n.sku || n.id,
    updatedAt: new Date().toISOString(),
  }));
}

async function lookupFirestoreProduct(change) {
  if (!db) return null;
  const ids = [change.productId, change.slug].filter(Boolean);
  for (const id of ids) {
    try {
      const snap = await getDoc(doc(db, 'products', id));
      if (snap.exists()) return { ref: snap.ref, data: { id: snap.id, ...snap.data() } };
    } catch {}
  }
  if (change.productName) {
    try {
      const q = query(collection(db, 'products'), where('name', '==', change.productName), limit(1));
      const snaps = await getDocs(q);
      if (!snaps.empty) {
        const snap = snaps.docs[0];
        return { ref: snap.ref, data: { id: snap.id, ...snap.data() } };
      }
    } catch {}
  }
  if (change.slug) {
    try {
      const q = query(collection(db, 'products'), where('slug', '==', change.slug), limit(1));
      const snaps = await getDocs(q);
      if (!snaps.empty) {
        const snap = snaps.docs[0];
        return { ref: snap.ref, data: { id: snap.id, ...snap.data() } };
      }
    } catch {}
  }
  return null;
}

function firestoreUpdateFromProduct(product) {
  const { id, ...data } = product;
  return {
    ...data,
    weightVariants: product.weightVariants || [],
    price: product.price,
    isActive: product.isActive !== false,
    isDeleted: Boolean(product.isDeleted),
    isBestseller: Boolean(product.isBestseller || product.bestseller),
    bestseller: Boolean(product.bestseller || product.isBestseller),
    updatedAt: new Date().toISOString(),
  };
}

async function commitInventoryBatch(changes) {
  const runnable = (changes || []).filter((c) => !c.noop);
  if (!runnable.length) return { wrote: 0 };
  if (!db) throw new Error('Firestore is not connected. Product updates were not saved.');

  const groups = new Map();
  const missing = [];
  for (const change of runnable) {
    const found = await lookupFirestoreProduct(change);
    if (!found) {
      missing.push(change.productName || change.productId || change.slug);
      continue;
    }
    const key = found.ref.path;
    if (!groups.has(key)) groups.set(key, { found, changes: [] });
    groups.get(key).changes.push(change);
  }
  if (!groups.size) {
    throw new Error(
      missing.length
        ? `No matching Firestore product for ${missing.join(', ')}. Add products in Firestore before updating inventory.`
        : 'Nothing was written.',
    );
  }
  if (missing.length) {
    throw new Error(`Firestore product not found for ${missing.join(', ')}. Nothing was written.`);
  }

  const batch = writeBatch(db);
  for (const { found, changes: group } of groups.values()) {
    const patched = patchProductWithChanges(normalizeProduct(found.data), group);
    batch.update(found.ref, JSON.parse(JSON.stringify(firestoreUpdateFromProduct(patched))));
  }
  await batch.commit();
  return { wrote: groups.size };
}

function requireDb() {
  if (!db) throw new Error('Firestore is not connected. Live orders cannot be loaded or updated.');
}

export const adminApi = {
  stats: async (from, to) => {
    requireDb();
    const [orders, products] = await Promise.all([listFirestoreOrders(), listFirestoreProducts()]);
    return computeStats(orders, products, from, to);
  },
  orders: async (params) => {
    requireDb();
    return filterAdminOrders(await listFirestoreOrders(), params);
  },
  setStatus: async (orderId, newStatus) => {
    requireDb();
    await appendOrderStatus(orderId, newStatus);
    return { orderId, orderStatus: newStatus };
  },
  createManual: async (payload) => {
    requireDb();
    const user = auth?.currentUser;
    const orderId = newOrderId();
    const nowIso = new Date().toISOString();
    const isCod = payload.paymentMethod === 'cod';
    const name = payload.recipientName || 'Walk-in';
    const phone = payload.recipientPhone || '';
    const total = Number(payload.total) || 0;
    await setDoc(doc(db, 'orders', orderId), {
      orderId,
      userId: user?.uid || null,
      source: 'admin-manual',
      customer: { name, phone, email: user?.email || null },
      recipientName: name,
      recipientPhone: phone,
      paymentMethod: payload.paymentMethod || 'whatsapp',
      paymentStatus: isCod ? 'pending' : 'paid',
      orderStatus: isCod ? 'pending_cod' : 'confirmed',
      total,
      totals: { subtotal: total, discount: 0, gst: 0, shipping: 0, total },
      items: payload.items || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      statusHistory: [{ status: isCod ? 'pending_cod' : 'confirmed', at: nowIso, byAdmin: true }],
    });
    return { orderId };
  },
  search: async (q) => {
    requireDb();
    const needle = String(q || '').trim().toLowerCase();
    if (!needle) return { orders: [], products: [], customers: [] };
    const [orders, products] = await Promise.all([listFirestoreOrders(), listFirestoreProducts()]);
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
    return { orders: matchedOrders, products: matchedProducts, customers };
  },
  products: async (params) => {
    requireDb();
    return listFirestoreProducts(params);
  },
  subscribeOrders: (params, onRows, onError) => {
    if (!db) {
      onRows([]);
      onError?.(new Error('Firestore is not connected.'));
      return () => {};
    }
    return onSnapshot(
      collection(db, 'orders'),
      (snap) => onRows(filterAdminOrders(snap.docs.map((d) => mapAdminOrder(d.id, d.data())), params)),
      (err) => {
        onRows([]);
        onError?.(err);
      },
    );
  },
  subscribeProducts: (params, onRows, onError) => {
    if (!db) {
      onRows(catalogFallback(params), { source: 'catalog' });
      return () => {};
    }
    return onSnapshot(
      collection(db, 'products'),
      (snap) => {
        let rows = snap.docs
          .map((d) => hydrateStorefrontProduct(d.id, d.data()))
          .filter((p) => !p.isDeleted);
        if (params?.activeOnly) rows = rows.filter((p) => p.isActive !== false);
        if (params?.limit) rows = rows.slice(0, params.limit);
        if (!rows.length) {
          onRows(catalogFallback(params), { source: 'catalog' });
          return;
        }
        onRows(rows, { source: 'firestore' });
      },
      (err) => {
        onRows(catalogFallback(params), { source: 'catalog' });
        onError?.(new Error(friendlyFsError(err, 'Could not load products.')));
      },
    );
  },
  subscribeDashboard: ({ from, to, status }, { onStats, onOrders, onProducts, onError }) => {
    if (!db) {
      onStats?.({ revenueToday: 0, revenueMonth: 0, totalOrders: 0, pending: 0, inStock: 0, outOfStock: 0 });
      onOrders?.([]);
      onProducts?.(catalogFallback({ limit: 6 }));
      return () => {};
    }
    let orders = [];
    let products = [];
    const emit = () => {
      onStats?.(computeStats(orders, products, from, to));
      onOrders?.(filterAdminOrders(orders, { status, from, to }));
      onProducts?.(products.slice(0, 6));
    };
    const u1 = onSnapshot(collection(db, 'orders'), (snap) => {
      orders = snap.docs.map((d) => mapAdminOrder(d.id, d.data()));
      emit();
    }, (err) => { orders = []; emit(); onError?.(err); });
    const u2 = onSnapshot(collection(db, 'products'), (snap) => {
      products = snap.docs.map((d) => hydrateStorefrontProduct(d.id, d.data())).filter((p) => !p.isDeleted);
      if (!products.length) products = catalogFallback({ limit: 6 });
      emit();
    }, (err) => { products = catalogFallback({ limit: 6 }); emit(); onError?.(new Error(friendlyFsError(err, 'Could not load live admin data.'))); });
    return () => { u1(); u2(); };
  },
  previewInventory: async (command) => {
    let products = [];
    try {
      products = await listFirestoreProducts({ activeOnly: false });
    } catch {
      products = [];
    }
    if (!products.length) products = catalogFallback({ activeOnly: false });
    const catalog = compactInventoryCatalog(products);
    if (!catalog.length) {
      throw new Error('No products available for the assistant. Publish the catalog from Products first.');
    }
    try {
      const r = await aiApi.post('/admin/ai-inventory/preview', { command, catalog });
      const data = r.data;
      if (!data || typeof data !== 'object' || Array.isArray(data) || data.error) {
        throw new Error(data?.message || data?.error || 'AI preview failed');
      }
      if (!Array.isArray(data.changes) || !data.changes.length) {
        throw new Error('Gemini did not propose a product change. Try a clearer command.');
      }
      const preview = savePreview({ command, changes: data.changes || [] });
      return { ...data, previewId: preview.previewId };
    } catch (err) {
      apiError(err, 'AI preview failed. Nothing was written.');
    }
  },
  seedCatalog: async () => {
    requireDb();
    try {
      const existing = await getDocs(collection(db, 'products'));
      if (!existing.empty) {
        return { wrote: 0, existing: existing.size };
      }
    } catch (err) {
      throw new Error(friendlyFsError(err, 'Could not read products.'));
    }
    const rows = catalogFallback({ activeOnly: false });
    if (!rows.length) throw new Error('Local catalog is empty.');
    const CHUNK = 400;
    let wrote = 0;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const batch = writeBatch(db);
      rows.slice(i, i + CHUNK).forEach((p) => {
        const id = p.id || p.slug;
        if (!id) return;
        batch.set(doc(db, 'products', id), productDocForFirestore(p), { merge: true });
        wrote += 1;
      });
      await batch.commit();
    }
    return { wrote, existing: 0 };
  },
  applyInventory: async (previewId, editedChanges) => {
    if (editedChanges) updatePreviewChanges(previewId, editedChanges);
    await commitInventoryBatch(editedChanges);
    return applyPreview(previewId);
  },
};
