/**
 * Local commerce source-of-truth used when Firebase/Netlify APIs are not configured.
 * Mirrors Firestore collections so the admin dashboard and public catalog stay in sync.
 */
import { PRODUCTS as MOCK_PRODUCTS } from '@/data/mockCatalog';

const LS = 'sk_commerce_v1';
const EVT = 'sk-catalog-updated';
const PREVIEW_TTL_MS = 5 * 60 * 1000;

export function normalizeProduct(p) {
  return hydrateProduct(p);
}

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function iso(d) {
  return (d instanceof Date ? d : new Date(d)).toISOString();
}

function hydrateProduct(p) {
  const fromLive = (p.weightVariants || []).map((v) => ({
    weight: v.weight || v.w,
    price: v.price,
    stock: typeof v.stock === 'number' ? v.stock : 20,
    sku: v.sku || `${p.sku || p.id}-${v.weight || v.w || 'std'}`,
  }));
  const fromStatic = (p.variants?.length ? p.variants : [{ w: p.weight || '250g', price: p.price }]).map((v) => ({
    weight: v.w || v.weight,
    price: v.price,
    stock: typeof v.stock === 'number' ? v.stock : 20,
    sku: v.sku || `${p.sku || p.id}-${v.w || v.weight || 'std'}`,
  }));
  const variants = fromLive.length ? fromLive : fromStatic;
  return {
    ...p,
    weightVariants: variants,
    variants: variants.map((v) => ({ w: v.weight, price: v.price, stock: v.stock })),
    isActive: p.isActive !== false,
    isDeleted: Boolean(p.isDeleted),
    isBestseller: Boolean(p.bestseller || p.isBestseller),
  };
}

const DEMO_ORDER_IDS = new Set(['8a97e087', 'b2c19f44', 'c7e4a901', 'd11ab672', 'e90c33da', 'f44de218']);

function seedOrders() {
  return [];
}

function stripDemoOrders(orders) {
  if (!Array.isArray(orders)) return [];
  return orders.filter((o) => o && !DEMO_ORDER_IDS.has(o.orderId));
}

function defaultState() {
  return {
    products: MOCK_PRODUCTS.map(hydrateProduct),
    orders: seedOrders(),
    previews: {},
    audit: [],
    hamperBuilds: {},
    chatSessions: {},
  };
}

function mergeCatalogAssets(products) {
  const byId = new Map(MOCK_PRODUCTS.map((p) => [p.id, p]));
  const bySlug = new Map(MOCK_PRODUCTS.map((p) => [p.slug, p]));
  return (products || []).map((p) => {
    const src = byId.get(p.id) || bySlug.get(p.slug);
    if (!src?.images?.length) return p;
    const have = new Set(p.images || []);
    const missing = src.images.filter((im) => !have.has(im));
    const images = missing.length || JSON.stringify(p.images) !== JSON.stringify(src.images)
      ? src.images
      : p.images;
    if (images === p.images) return p;
    return { ...p, images };
  });
}

let memState = null;

function load() {
  if (memState) return memState;
  try {
    const raw = localStorage.getItem(LS);
    if (!raw) {
      memState = defaultState();
      return memState;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.products) || !parsed.products.length) {
      memState = defaultState();
      return memState;
    }
    const products = mergeCatalogAssets(parsed.products).map(hydrateProduct);
    const next = { ...defaultState(), ...parsed, products, orders: stripDemoOrders(parsed.orders) };
    if ((parsed.orders || []).length !== next.orders.length) {
      try { localStorage.setItem(LS, JSON.stringify(next)); } catch {}
    }
    memState = next;
    return memState;
  } catch {
    memState = defaultState();
    return memState;
  }
}

function save(state) {
  memState = state;
  try {
    localStorage.setItem(LS, JSON.stringify(state));
  } catch {}
  window.dispatchEvent(new CustomEvent(EVT));
}

export function subscribeCatalog(fn) {
  const handler = () => fn();
  const onStorage = () => {
    memState = null;
    fn();
  };
  window.addEventListener(EVT, handler);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVT, handler);
    window.removeEventListener('storage', onStorage);
  };
}

export function getState() {
  return load();
}

export function getLiveProducts({ activeOnly = true, limit } = {}) {
  let list = load().products.filter((p) => !p.isDeleted);
  if (activeOnly) list = list.filter((p) => p.isActive !== false);
  if (limit) list = list.slice(0, limit);
  return list;
}

export function variantInStock(p, weight) {
  const variants = p.weightVariants || [];
  if (!variants.length) return true;
  const v = weight ? variants.find((x) => x.weight === weight) : variants[0];
  return (v?.stock ?? 0) > 0;
}

export function productInStock(p) {
  const variants = p.weightVariants || [];
  if (!variants.length) return true;
  return variants.some((v) => (v.stock ?? 0) > 0);
}

export function dashboardStats({ from, to } = {}) {
  const state = load();
  const fromD = from ? new Date(from) : startOfDay();
  const toD = to ? new Date(to) : new Date();
  toD.setHours(23, 59, 59, 999);
  const monthStart = startOfMonth();
  const todayStart = startOfDay();
  const inRange = (o) => {
    const t = new Date(o.createdAt);
    return t >= fromD && t <= toD;
  };
  const orders = state.orders;
  const revenueToday = orders
    .filter((o) => o.paymentStatus === 'paid' && new Date(o.createdAt) >= todayStart)
    .reduce((s, o) => s + (o.total || 0), 0);
  const revenueMonth = orders
    .filter((o) => o.paymentStatus === 'paid' && new Date(o.createdAt) >= monthStart)
    .reduce((s, o) => s + (o.total || 0), 0);
  const ranged = orders.filter(inRange);
  const pending = ranged.filter((o) => o.orderStatus === 'pending' || o.paymentStatus === 'pending' || o.orderStatus === 'pending_cod').length;
  let inStock = 0;
  let outOfStock = 0;
  state.products.filter((p) => !p.isDeleted).forEach((p) => {
    (p.weightVariants || []).forEach((v) => {
      if ((v.stock ?? 0) > 0) inStock += 1;
      else outOfStock += 1;
    });
  });
  return {
    revenueToday,
    revenueMonth,
    totalOrders: ranged.length,
    pending,
    inStock,
    outOfStock,
  };
}

export function listOrders({ status = 'all', from, to } = {}) {
  const fromD = from ? new Date(from) : startOfDay();
  const toD = to ? new Date(to) : new Date();
  toD.setHours(23, 59, 59, 999);
  return load()
    .orders
    .filter((o) => {
      const t = new Date(o.createdAt);
      if (t < fromD || t > toD) return false;
      if (!status || status === 'all') return true;
      return o.orderStatus === status;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function updateOrderStatus(orderId, newStatus, adminEmail = 'sukhmaldryfruitskorner2@gmail.com') {
  const state = load();
  const idx = state.orders.findIndex((o) => o.orderId === orderId || `#${o.orderId}` === orderId);
  if (idx < 0) throw new Error('Order not found');
  const before = { ...state.orders[idx] };
  const next = {
    ...before,
    orderStatus: newStatus,
    updatedAt: iso(new Date()),
    statusHistory: [...(before.statusHistory || []), { status: newStatus, at: iso(new Date()), byAdmin: true }],
  };
  if (newStatus === 'delivered' && before.paymentMethod === 'cod') {
    next.paymentStatus = 'paid';
  }
  state.orders[idx] = next;
  state.audit.unshift({
    adminEmail,
    action: 'order.status',
    targetCollection: 'orders',
    targetDocId: orderId,
    before: { orderStatus: before.orderStatus },
    after: { orderStatus: newStatus },
    timestamp: iso(new Date()),
  });
  save(state);
  return next;
}

export function createManualOrder(payload, adminEmail = 'sukhmaldryfruitskorner2@gmail.com') {
  const state = load();
  const orderId = Math.random().toString(16).slice(2, 10);
  const order = {
    orderId,
    recipientName: payload.recipientName || 'Walk-in',
    recipientPhone: payload.recipientPhone || '',
    paymentMethod: payload.paymentMethod || 'whatsapp',
    paymentStatus: payload.paymentStatus || (payload.paymentMethod === 'cod' ? 'pending' : 'paid'),
    orderStatus: payload.paymentMethod === 'cod' ? 'pending_cod' : 'confirmed',
    total: Number(payload.total) || 0,
    subtotal: Number(payload.total) || 0,
    deliveryCharge: 0,
    gst: 0,
    items: payload.items || [],
    createdAt: iso(new Date()),
    updatedAt: iso(new Date()),
    statusHistory: [{ status: payload.paymentMethod === 'cod' ? 'pending_cod' : 'confirmed', at: iso(new Date()), byAdmin: true }],
  };
  state.orders.unshift(order);
  state.audit.unshift({
    adminEmail,
    action: 'orders.create-manual',
    targetCollection: 'orders',
    targetDocId: orderId,
    before: null,
    after: order,
    timestamp: iso(new Date()),
  });
  save(state);
  return order;
}

export function createCheckoutOrder({ items, paymentMethod, address, totals, razorpayOrderId }) {
  const state = load();
  const existing = razorpayOrderId
    ? state.orders.find((o) => o.razorpayOrderId === razorpayOrderId)
    : null;
  if (existing) return { idempotent: true, order: existing };

  const priced = (items || []).map((it) => {
    const p = state.products.find((x) => x.id === it.id || x.slug === it.slug);
    const weight = it.variant || it.weight;
    const v = p?.weightVariants?.find((w) => w.weight === weight) || p?.weightVariants?.[0];
    const price = v?.price ?? p?.price ?? it.price ?? 0;
    const stock = v?.stock ?? 0;
    if (p && v && stock < (it.qty || 1)) {
      throw new Error(`Insufficient stock for ${p.name}`);
    }
    return {
      productId: p?.id || it.id,
      name: p?.name || it.name,
      weight: weight || null,
      qty: it.qty || 1,
      price,
    };
  });
  const subtotal = priced.reduce((s, x) => s + x.qty * x.price, 0);
  const deliveryCharge = subtotal >= 999 ? 0 : (subtotal > 0 ? 79 : 0);
  const gst = Math.round(subtotal * 0.05);
  const total = Math.max(0, subtotal + deliveryCharge + gst);
  const isCod = paymentMethod === 'cod';
  const orderId = Math.random().toString(16).slice(2, 10);
  const order = {
    orderId,
    recipientName: address?.name || '',
    recipientPhone: address?.phone || '',
    shippingAddress: address || null,
    paymentMethod: isCod ? 'cod' : (paymentMethod === 'whatsapp' ? 'whatsapp' : 'razorpay'),
    razorpayOrderId: razorpayOrderId || null,
    paymentStatus: isCod ? 'pending' : 'paid',
    orderStatus: isCod ? 'pending_cod' : 'confirmed',
    items: priced,
    subtotal,
    deliveryCharge,
    gst,
    total: totals?.total && !razorpayOrderId ? total : total,
    createdAt: iso(new Date()),
    updatedAt: iso(new Date()),
    statusHistory: [{ status: isCod ? 'pending_cod' : 'confirmed', at: iso(new Date()), byAdmin: false }],
  };

  if (!isCod && order.paymentStatus === 'paid') {
    priced.forEach((it) => {
      const p = state.products.find((x) => x.id === it.productId);
      if (!p) return;
      p.weightVariants = (p.weightVariants || []).map((v) => (
        v.weight === it.weight ? { ...v, stock: Math.max(0, (v.stock || 0) - it.qty) } : v
      ));
    });
  }

  state.orders.unshift(order);
  save(state);
  return { idempotent: false, order };
}

export function searchAll(q, limit = 5) {
  const needle = (q || '').trim().toLowerCase();
  if (!needle) return { orders: [], products: [], customers: [] };
  const state = load();
  const orders = state.orders.filter((o) =>
    o.orderId.toLowerCase().includes(needle)
    || (o.recipientName || '').toLowerCase().includes(needle)
    || (o.recipientPhone || '').includes(needle),
  ).slice(0, limit);
  const products = state.products.filter((p) =>
    !p.isDeleted && (
      p.name.toLowerCase().includes(needle)
      || p.slug.toLowerCase().includes(needle)
      || (p.category || '').toLowerCase().includes(needle)
    ),
  ).slice(0, limit);
  const seen = new Set();
  const customers = [];
  state.orders.forEach((o) => {
    const key = `${o.recipientName}|${o.recipientPhone}`;
    if (seen.has(key)) return;
    if ((o.recipientName || '').toLowerCase().includes(needle) || (o.recipientPhone || '').includes(needle)) {
      seen.add(key);
      customers.push({ name: o.recipientName, phone: o.recipientPhone });
    }
  });
  return { orders, products, customers: customers.slice(0, limit) };
}

export function weightsEqual(a, b) {
  const na = String(a || '').replace(/\s+/g, '').toLowerCase();
  const nb = String(b || '').replace(/\s+/g, '').toLowerCase();
  return Boolean(na) && na === nb;
}

/** Storefront + admin chips: prefer live weightVariants over static catalog variants. */
export function packVariants(p) {
  if (p?.weightVariants?.length) {
    return p.weightVariants.map((v) => ({
      w: v.weight,
      price: v.price,
      stock: v.stock,
    }));
  }
  if (p?.variants?.length) return p.variants;
  return [{ w: p?.weight || '250g', price: p?.price, stock: p?.stock }];
}

export function patchProductWithChanges(product, changes) {
  const next = {
    ...product,
    weightVariants: (product.weightVariants || []).map((v) => ({ ...v })),
  };
  const variantOf = (change) => change.weight || change.variant || null;

  for (const change of changes || []) {
    if (change.noop) continue;
    const field = change.field;
    const val = change.after ?? change.newValue;
    const weight = variantOf(change);
    const match = (v) => !weight || weightsEqual(v.weight, weight);

    if (field === 'inStock') {
      const want = Boolean(val);
      next.weightVariants = next.weightVariants.map((v) => (
        match(v) ? { ...v, stock: want ? Math.max(Number(v.stock) || 0, 20) : 0 } : v
      ));
    } else if (field === 'stock') {
      const n = Number(val);
      next.weightVariants = next.weightVariants.map((v) => (match(v) ? { ...v, stock: n } : v));
    } else if (field === 'price') {
      const n = Number(val);
      next.weightVariants = next.weightVariants.map((v) => (match(v) ? { ...v, price: n } : v));
      if (!weight) next.price = n;
      else {
        const first = next.weightVariants[0];
        if (first && weightsEqual(first.weight, weight)) next.price = n;
      }
    } else if (field === 'isActive') {
      next.isActive = Boolean(val);
    } else if (field === 'isDeleted') {
      next.isDeleted = Boolean(val);
      if (next.isDeleted) next.isActive = false;
    } else if (field === 'isBestseller') {
      next.isBestseller = Boolean(val);
      next.bestseller = Boolean(val);
    }
  }

  next.updatedAt = iso(new Date());
  if (next.weightVariants?.length && next.variants) {
    next.variants = next.weightVariants.map((v) => ({ w: v.weight, price: v.price, stock: v.stock }));
  }
  return next;
}

export function replaceProductsFromRemote(rows) {
  if (!Array.isArray(rows) || !rows.length) return;
  const state = load();
  const prevById = new Map(state.products.map((p) => [p.id, p]));
  const prevBySlug = new Map(state.products.map((p) => [p.slug, p]));
  state.products = rows.map((row) => {
    const prev = prevById.get(row.id) || prevBySlug.get(row.slug) || {};
    return hydrateProduct({ ...prev, ...row });
  });
  save(state);
}

export function compactInventoryCatalog(products) {
  return (products || []).map((p) => {
    const variants = p.weightVariants || [];
    const stock = variants.reduce((s, v) => s + (typeof v.stock === 'number' ? v.stock : 0), 0);
    const inStock = variants.length ? variants.some((v) => (v.stock ?? 0) > 0) : true;
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category,
      subcategory: p.subcategory,
      price: p.price,
      inStock,
      stock: variants[0]?.stock ?? stock,
      isActive: p.isActive !== false,
      isDeleted: Boolean(p.isDeleted),
      isBestseller: Boolean(p.bestseller || p.isBestseller),
      image: Array.isArray(p.images) ? p.images[0] : (p.img || null),
      images: Array.isArray(p.images) && p.images[0] ? [p.images[0]] : (p.img ? [p.img] : []),
      weightVariants: variants.map((v) => ({ weight: v.weight, price: v.price, stock: v.stock })),
    };
  });
}

export function applyFieldChange(change, adminEmail = 'sukhmaldryfruitskorner2@gmail.com', existingState) {
  const persist = !existingState;
  const state = existingState || load();
  const p = state.products.find((x) => x.id === change.productId || x.slug === change.slug);
  if (!p) throw new Error(`Product missing: ${change.productName || change.productId}`);
  const field = change.field;
  const next = change.after ?? change.newValue;
  const patched = patchProductWithChanges(p, [change]);
  Object.assign(p, patched);

  state.audit.unshift({
    adminEmail,
    action: `ai-inventory.update.${field}`,
    targetCollection: 'products',
    targetDocId: p.id,
    before: change.before ?? change.currentValue,
    after: next,
    command: change.command || '',
    timestamp: iso(new Date()),
  });
  if (persist) save(state);
  return p;
}

export function updatePreviewChanges(previewId, changes) {
  const state = load();
  const preview = state.previews[previewId];
  if (!preview) throw new Error('Preview not found');
  preview.changes = changes;
  save(state);
  return preview;
}

export function savePreview({ command, changes, adminEmail }) {
  const state = load();
  const previewId = `prv_${Math.random().toString(36).slice(2, 10)}`;
  state.previews[previewId] = {
    previewId,
    command,
    changes,
    adminEmail,
    createdAt: Date.now(),
    expiresAt: Date.now() + PREVIEW_TTL_MS,
  };
  save(state);
  return state.previews[previewId];
}

export function applyPreview(previewId, adminEmail = 'sukhmaldryfruitskorner2@gmail.com') {
  const state = load();
  const preview = state.previews[previewId];
  if (!preview) throw new Error('Preview not found');
  if (Date.now() > preview.expiresAt) {
    delete state.previews[previewId];
    save(state);
    throw new Error('Preview expired — run Preview again');
  }
  const applied = [];
  preview.changes.forEach((change) => {
    if (change.type === 'list') return;
    const p = state.products.find((x) => x.id === change.productId || x.slug === change.slug);
    if (change.productId && !p && change.type !== 'add') {
      // Firestore is the live catalog; skip local-only rows that are not in this browser store.
      applied.push(change);
      return;
    }
    if ((change.type === 'update' || change.field) && p && change.type !== 'stock' && change.type !== 'price' && change.type !== 'discount' && change.type !== 'remove') {
      if (change.noop) return;
      applyFieldChange({ ...change, command: preview.command }, adminEmail, state);
      applied.push(change);
      return;
    }
    if (change.type === 'stock' && p) {
      p.weightVariants = (p.weightVariants || []).map((v) => {
        if (change.weight && v.weight !== change.weight) return v;
        return { ...v, stock: change.after ? (v.stock || 20) : 0 };
      });
      if (!change.weight) {
        p.weightVariants = (p.weightVariants || []).map((v) => ({ ...v, stock: change.after ? (v.stock || 20) : 0 }));
      }
    }
    if (change.type === 'price' && p) {
      p.weightVariants = (p.weightVariants || []).map((v) => {
        if (change.weight && v.weight !== change.weight) return v;
        return { ...v, price: Number(change.after) };
      });
      if (!change.weight) p.price = Number(change.after);
    }
    if (change.type === 'discount' && change.productId && p) {
      p.weightVariants = (p.weightVariants || []).map((v) => ({
        ...v,
        price: Math.round(v.price * (1 - (change.discountPercent || 0) / 100)),
      }));
      p.price = Math.round((p.price || 0) * (1 - (change.discountPercent || 0) / 100));
    }
    if (change.type === 'remove' && p) {
      p.isDeleted = true;
      p.isActive = false;
    }
    applied.push(change);
    state.audit.unshift({
      adminEmail,
      action: `ai-inventory.${change.type}`,
      targetCollection: 'products',
      targetDocId: change.productId || change.category || previewId,
      before: change.before,
      after: change.after,
      command: preview.command,
      timestamp: iso(new Date()),
    });
  });
  delete state.previews[previewId];
  save(state);
  return { applied };
}

export function quoteCart(items) {
  const state = load();
  return (items || []).map((it) => {
    const p = state.products.find((x) => x.id === it.id || x.slug === it.slug);
    if (!p || p.isDeleted) throw new Error('Product no longer available');
    const weight = it.variant || it.weight;
    const v = p.weightVariants?.find((w) => w.weight === weight) || p.weightVariants?.[0];
    if ((v?.stock ?? 0) < (it.qty || 1)) throw new Error(`Out of stock: ${p.name}`);
    return { ...it, price: v?.price ?? p.price, name: p.name };
  });
}

export function saveHamperBuild(build) {
  const state = load();
  const id = build.id || `hb_${Math.random().toString(36).slice(2, 10)}`;
  const prev = state.hamperBuilds[id] || { generationCount: 0 };
  const next = {
    ...prev,
    ...build,
    id,
    generationCount: (prev.generationCount || 0) + (build.bumpGeneration ? 1 : 0),
    updatedAt: iso(new Date()),
  };
  delete next.bumpGeneration;
  state.hamperBuilds[id] = next;
  save(state);
  return next;
}

export function getHamperBuild(id) {
  return load().hamperBuilds[id] || null;
}

export const CATALOG_EVENT = EVT;
export const PREVIEW_TTL = PREVIEW_TTL_MS;
