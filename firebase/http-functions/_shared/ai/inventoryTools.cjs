const { adminDb } = require('../firebaseAdmin');
const { canonicalStatus } = require('../orderStatus');

const WRITE_TOOLS = new Set(['updateStock', 'updatePrice']);
const ordersCache = { at: 0, rows: null };

const ASSISTANT_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'getRevenue',
        description: 'Sum paid order revenue for a date range.',
        parameters: {
          type: 'object',
          properties: {
            dateRange: {
              type: 'string',
              description: 'today, week, 7d, 30d, 90d, month, or YYYY-MM-DD:YYYY-MM-DD',
            },
          },
        },
      },
      {
        name: 'getOrdersToday',
        description: "Count today's orders and paid revenue.",
        parameters: { type: 'object', properties: {} },
      },
      {
        name: 'getLowStock',
        description: 'List products or pack sizes at or below a stock threshold.',
        parameters: {
          type: 'object',
          properties: {
            threshold: { type: 'number', description: 'Units at or below this count as low stock. Default 5.' },
          },
        },
      },
      {
        name: 'getTopProducts',
        description: 'Top selling products by units and revenue.',
        parameters: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'How many products to return. Default 5.' },
            dateRange: { type: 'string', description: 'today, week, 7d, 30d, 90d, month' },
          },
        },
      },
      {
        name: 'getWebsiteAnalyticsSummary',
        description: 'Website visitor, funnel, and CTA summary from daily rollups.',
        parameters: {
          type: 'object',
          properties: {
            dateRange: { type: 'string', description: '7d, 30d, 90d, week' },
          },
        },
      },
      {
        name: 'getCategorySummary',
        description: 'Count catalog products in a shop category (dry-fruits, nuts, seeds, dates, berries, gift-hampers, or all). Use for “how many products” and “total stock of dry fruits”. Answer with a product count, never kilograms.',
        parameters: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Category slug or name: dry-fruits, nuts, seeds, dates, berries, gift-hampers, or all',
            },
          },
        },
      },
      {
        name: 'updateStock',
        description: 'Propose a stock quantity change. Does not write until the admin confirms Apply.',
        parameters: {
          type: 'object',
          properties: {
            productName: { type: 'string' },
            quantity: { type: 'number' },
            variant: { type: 'string', description: 'Pack size such as 250g or 500g' },
          },
          required: ['productName', 'quantity'],
        },
      },
      {
        name: 'updatePrice',
        description: 'Propose a price change in rupees. Does not write until the admin confirms Apply.',
        parameters: {
          type: 'object',
          properties: {
            productName: { type: 'string' },
            price: { type: 'number' },
            variant: { type: 'string', description: 'Pack size such as 250g or 500g' },
          },
          required: ['productName', 'price'],
        },
      },
    ],
  },
];

function isWriteTool(name) {
  return WRITE_TOOLS.has(name);
}

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function istDay(d = new Date()) {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function rangeBounds(dateRange = 'today') {
  const raw = String(dateRange || 'today').trim().toLowerCase();
  const to = new Date();
  const from = new Date();
  const isoPair = raw.match(/^(\d{4}-\d{2}-\d{2})\s*[:/to]+\s*(\d{4}-\d{2}-\d{2})$/);
  if (isoPair) {
    return { from: new Date(`${isoPair[1]}T00:00:00`), to: new Date(`${isoPair[2]}T23:59:59`) };
  }
  if (raw === 'week' || raw === '7d' || raw === '7') from.setDate(from.getDate() - 7);
  else if (raw === '30d' || raw === '30') from.setDate(from.getDate() - 30);
  else if (raw === '90d' || raw === '90') from.setDate(from.getDate() - 90);
  else if (raw === 'month') from.setDate(1);
  else from.setHours(0, 0, 0, 0);
  return { from, to };
}

function isPaid(order) {
  return order.paymentStatus === 'paid';
}

function mapOrder(id, data = {}) {
  return {
    id,
    createdAt: toDate(data.createdAt) || new Date(0),
    paymentStatus: data.paymentStatus || '',
    paymentMethod: data.paymentMethod || '',
    status: canonicalStatus(data.status || data.orderStatus),
    total: Number(data.total ?? data.totals?.total) || 0,
    items: Array.isArray(data.items) ? data.items : [],
  };
}

async function loadOrders() {
  const now = Date.now();
  if (ordersCache.rows && now - ordersCache.at < 45000) return ordersCache.rows;
  const sdk = await adminDb();
  if (!sdk) return [];
  const snap = await sdk.db.collection('orders').get();
  const rows = snap.docs.map((d) => mapOrder(d.id, d.data()));
  ordersCache = { at: now, rows };
  return rows;
}

async function loadProducts() {
  const sdk = await adminDb();
  if (!sdk) return [];
  const snap = await sdk.db.collection('products').get();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => !p.isDeleted);
}

function inRange(order, from, to) {
  return order.createdAt >= from && order.createdAt <= to;
}

async function runInventoryTool(name, args = {}, catalog = []) {
  const fn = TOOLS[name];
  if (!fn) return { error: `Unknown tool ${name}` };
  try {
    return await fn(args || {}, catalog);
  } catch (err) {
    return { error: err.message || `Tool ${name} failed` };
  }
}

async function getRevenue({ dateRange } = {}) {
  const { from, to } = rangeBounds(dateRange || 'today');
  const orders = (await loadOrders()).filter((o) => inRange(o, from, to));
  const paid = orders.filter(isPaid);
  const revenue = paid.reduce((s, o) => s + o.total, 0);
  return {
    dateRange: dateRange || 'today',
    from: from.toISOString(),
    to: to.toISOString(),
    orderCount: orders.length,
    paidOrders: paid.length,
    revenue,
  };
}

async function getOrdersToday() {
  return getRevenue({ dateRange: 'today' });
}

async function getLowStock({ threshold } = {}, catalog = []) {
  const cut = Number.isFinite(Number(threshold)) ? Number(threshold) : 5;
  const products = catalog.length ? catalog : await loadProducts();
  const rows = [];
  products.forEach((p) => {
    const variants = p.weightVariants || p.variants || [];
    if (!variants.length) {
      const stock = typeof p.stock === 'number' ? p.stock : (p.inStock === false ? 0 : 20);
      if (stock <= cut) {
        rows.push({
          productId: p.id,
          productName: p.name,
          variant: '',
          stock,
          status: stock <= 0 ? 'out' : 'low',
        });
      }
      return;
    }
    variants.forEach((v) => {
      const stock = typeof v.stock === 'number' ? v.stock : 0;
      if (stock <= cut) {
        rows.push({
          productId: p.id,
          productName: p.name,
          variant: v.weight || v.w || '',
          stock,
          status: stock <= 0 ? 'out' : 'low',
        });
      }
    });
  });
  rows.sort((a, b) => a.stock - b.stock);
  return { threshold: cut, count: rows.length, items: rows.slice(0, 40) };
}

async function getTopProducts({ limit, dateRange } = {}) {
  const cap = Math.min(20, Math.max(1, Number(limit) || 5));
  const { from, to } = rangeBounds(dateRange || '30d');
  const orders = (await loadOrders()).filter((o) => inRange(o, from, to) && isPaid(o));
  const map = new Map();
  orders.forEach((o) => {
    (o.items || []).forEach((it) => {
      const id = String(it.productId || it.id || it.slug || it.name || '').trim();
      if (!id) return;
      const row = map.get(id) || { productId: id, name: it.name || id, units: 0, revenue: 0 };
      const qty = Number(it.qty) || 0;
      row.units += qty;
      row.revenue += (Number(it.price) || 0) * qty;
      map.set(id, row);
    });
  });
  const items = [...map.values()].sort((a, b) => b.units - a.units).slice(0, cap);
  return { dateRange: dateRange || '30d', items };
}

const CATEGORY_LABELS = {
  'dry-fruits': 'Dry Fruits',
  nuts: 'Nuts',
  seeds: 'Seeds',
  dates: 'Dates',
  berries: 'Berries',
  'gift-hampers': 'Gift Hampers',
  all: 'all categories',
};

function resolveCategory(raw) {
  const t = String(raw || '').toLowerCase().replace(/[_]+/g, ' ').trim();
  if (!t || t === 'all' || t === 'catalog') return 'all';
  if (/dry\s*fruit/.test(t) || t === 'dry-fruits' || /dry[\s_-]*fruit/.test(t)) return 'dry-fruits';
  if (/hamper/.test(t)) return 'gift-hampers';
  if (/^nuts?$/.test(t)) return 'nuts';
  if (/^seeds?$/.test(t)) return 'seeds';
  if (/^dates?$/.test(t)) return 'dates';
  if (/berr/.test(t)) return 'berries';
  return CATEGORY_LABELS[t] ? t : t.replace(/\s+/g, '-');
}

function productInCategory(product, slug) {
  if (slug === 'all') return true;
  const cat = String(product.category || '').toLowerCase().replace(/\s+/g, '-');
  return cat === slug;
}

function productIsInStock(product) {
  const variants = product.weightVariants || product.variants || [];
  if (variants.length) return variants.some((v) => (Number(v.stock) || 0) > 0);
  if (typeof product.inStock === 'boolean') return product.inStock;
  return (Number(product.stock) || 0) > 0;
}

async function getCategorySummary({ category } = {}, catalog = []) {
  const slug = resolveCategory(category);
  const products = (catalog.length ? catalog : await loadProducts()).filter((p) => !p.isDeleted);
  const rows = products.filter((p) => productInCategory(p, slug));
  const inStock = rows.filter(productIsInStock);
  return {
    category: slug,
    label: CATEGORY_LABELS[slug] || slug,
    productCount: rows.length,
    inStockCount: inStock.length,
    names: rows.map((p) => p.name).filter(Boolean).slice(0, 20),
  };
}

async function getWebsiteAnalyticsSummary({ dateRange } = {}) {
  const { from, to } = rangeBounds(dateRange || '7d');
  const sdk = await adminDb();
  if (!sdk) return { error: 'Firestore unavailable', empty: true };
  const days = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  while (cursor <= end) {
    days.push(istDay(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  const docs = await Promise.all(days.map((id) => sdk.db.collection('analytics_daily').doc(id).get()));
  const rows = docs.filter((d) => d.exists).map((d) => ({ id: d.id, ...d.data() }));
  if (!rows.length) {
    return {
      empty: true,
      message: 'No website analytics yet. Events start after the store is visited; daily rollup fills this summary.',
      dateRange: dateRange || '7d',
    };
  }
  const sum = (key) => rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);
  const views = sum('productViews');
  const carts = sum('addToCart');
  const checkouts = sum('checkoutStarted');
  const orders = sum('orderPlaced');
  const unique = sum('uniqueVisitors');
  const returning = sum('returningVisitors');
  return {
    dateRange: dateRange || '7d',
    days: rows.length,
    uniqueVisitors: unique,
    returningVisitors: returning,
    retentionPct: unique ? Math.round((returning / unique) * 1000) / 10 : 0,
    productViews: views,
    addToCart: carts,
    addToCartRate: views ? Math.round((carts / views) * 1000) / 10 : 0,
    funnel: {
      productView: views,
      addToCart: carts,
      checkoutStarted: checkouts,
      orderPlaced: orders,
    },
    hamperBuilderStarts: sum('hamperBuilderStarted'),
    wishlistAdds: sum('wishlistAdd'),
    aiWidgetUses: sum('aiWidgetUsed'),
  };
}

function updateStock({ productName, quantity, variant } = {}) {
  return {
    proposed: true,
    field: 'stock',
    productName,
    variant: variant || '',
    newValue: Number(quantity),
    note: 'Preview only. Confirm Apply to write this stock change.',
  };
}

function updatePrice({ productName, price, variant } = {}) {
  return {
    proposed: true,
    field: 'price',
    productName,
    variant: variant || '',
    newValue: Number(price),
    note: 'Preview only. Confirm Apply to write this price change.',
  };
}

const TOOLS = {
  getRevenue,
  getOrdersToday,
  getLowStock,
  getTopProducts,
  getWebsiteAnalyticsSummary,
  getCategorySummary,
  updateStock,
  updatePrice,
};

module.exports = {
  ASSISTANT_TOOLS,
  isWriteTool,
  runInventoryTool,
};
