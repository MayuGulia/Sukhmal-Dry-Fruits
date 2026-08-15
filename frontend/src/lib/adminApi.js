import { api } from '@/lib/api';
import {
  dashboardStats,
  listOrders,
  updateOrderStatus,
  createManualOrder,
  searchAll,
  getLiveProducts,
  applyPreview,
  savePreview,
  compactInventoryCatalog,
} from '@/lib/commerceStore';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';

async function tryApi(fn, fallback) {
  try {
    return await fn();
  } catch {
    return fallback();
  }
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
  return null;
}

function firestorePayload(change, current) {
  const field = change.field;
  const next = change.after ?? change.newValue;
  if (field === 'inStock') {
    const want = Boolean(next);
    const variants = (current.weightVariants || []).map((v) => ({
      ...v,
      stock: want ? Math.max(v.stock || 0, 20) : 0,
    }));
    return { weightVariants: variants, updatedAt: new Date().toISOString() };
  }
  if (field === 'stock') {
    const n = Number(next);
    const variants = (current.weightVariants || []).map((v) => (
      change.weight && v.weight !== change.weight ? v : { ...v, stock: n }
    ));
    return { weightVariants: variants, updatedAt: new Date().toISOString() };
  }
  if (field === 'price') {
    const n = Number(next);
    const variants = (current.weightVariants || []).map((v) => (
      change.weight && v.weight !== change.weight ? v : { ...v, price: n }
    ));
    return { price: n, weightVariants: variants, updatedAt: new Date().toISOString() };
  }
  if (field === 'isActive') return { isActive: Boolean(next), updatedAt: new Date().toISOString() };
  if (field === 'isDeleted') return { isDeleted: Boolean(next), isActive: !next, updatedAt: new Date().toISOString() };
  if (field === 'isBestseller') return { isBestseller: Boolean(next), bestseller: Boolean(next), updatedAt: new Date().toISOString() };
  return { [field]: next, updatedAt: new Date().toISOString() };
}

export const adminApi = {
  stats: (from, to) => tryApi(
    () => api.get('/admin/dashboard-stats', { params: { from, to } }).then((r) => r.data),
    () => dashboardStats({ from, to }),
  ),
  orders: (params) => tryApi(
    () => api.get('/admin/orders', { params }).then((r) => r.data),
    () => listOrders(params),
  ),
  setStatus: (orderId, newStatus) => tryApi(
    () => api.post('/admin/orders/status', { orderId, newStatus }).then((r) => r.data),
    () => updateOrderStatus(orderId, newStatus),
  ),
  createManual: (payload) => tryApi(
    () => api.post('/admin/orders/create-manual', payload).then((r) => r.data),
    () => createManualOrder(payload),
  ),
  search: (q) => tryApi(
    () => api.get('/admin/search', { params: { q } }).then((r) => r.data),
    () => searchAll(q),
  ),
  products: (params) => tryApi(
    () => api.get('/admin/products', { params }).then((r) => r.data),
    () => getLiveProducts({ activeOnly: params?.activeOnly !== false, limit: params?.limit }),
  ),
  previewInventory: async (command) => {
    const catalog = compactInventoryCatalog(getLiveProducts({ activeOnly: false }));
    try {
      const r = await api.post('/admin/ai-inventory/preview', { command, catalog });
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
  applyInventory: async (previewId) => {
    const result = applyPreview(previewId);
    const applied = result?.applied || [];
    await Promise.all(applied.map(async (change) => {
      if (change.noop) return;
      const found = await lookupFirestoreProduct(change);
      if (!found) return;
      try {
        await updateDoc(found.ref, firestorePayload(change, found.data));
      } catch {
        /* rules require admin custom claim; local catalog still updated */
      }
    }));
    return result;
  },
};
