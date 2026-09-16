const { adminDb } = require('./firebaseAdmin');

const EVENT_KEYS = {
  page_view: 'pageViews',
  product_view: 'productViews',
  add_to_cart: 'addToCart',
  wishlist_add: 'wishlistAdd',
  checkout_started: 'checkoutStarted',
  order_placed: 'orderPlaced',
  hamper_builder_started: 'hamperBuilderStarted',
  ai_widget_used: 'aiWidgetUsed',
};

function istDay(d = new Date()) {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function istMonth(d = new Date()) {
  return istDay(d).slice(0, 7);
}

function emptyDoc(day) {
  return {
    day,
    uniqueVisitors: 0,
    returningVisitors: 0,
    pageViews: 0,
    productViews: 0,
    addToCart: 0,
    wishlistAdd: 0,
    checkoutStarted: 0,
    orderPlaced: 0,
    hamperBuilderStarted: 0,
    aiWidgetUsed: 0,
    addToCartRate: 0,
    topProducts: [],
    funnel: {
      productView: 0,
      addToCart: 0,
      checkoutStarted: 0,
      orderPlaced: 0,
    },
  };
}

function bumpMap(map, key, by = 1) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + by);
}

async function rollupDay(day) {
  const sdk = await adminDb();
  if (!sdk) throw new Error('Firestore unavailable for analytics rollup');
  const snap = await sdk.db.collection('analytics_events').where('day', '==', day).get();
  const doc = emptyDoc(day);
  const sessions = new Set();
  const returningSessions = new Set();
  const productViews = new Map();

  snap.docs.forEach((row) => {
    const data = row.data() || {};
    const type = data.event_type;
    const session = data.session_id;
    const field = EVENT_KEYS[type];
    if (field) doc[field] += 1;
    if (session) {
      sessions.add(session);
      if (data.returning === true) returningSessions.add(session);
    }
    if (type === 'product_view' && (data.product_id || data.metadata?.name)) {
      const id = String(data.product_id || data.metadata?.name);
      bumpMap(productViews, id, 1);
    }
  });

  doc.uniqueVisitors = sessions.size;
  doc.returningVisitors = returningSessions.size;
  doc.addToCartRate = doc.productViews
    ? Math.round((doc.addToCart / doc.productViews) * 1000) / 10
    : 0;
  doc.funnel = {
    productView: doc.productViews,
    addToCart: doc.addToCart,
    checkoutStarted: doc.checkoutStarted,
    orderPlaced: doc.orderPlaced,
  };
  doc.topProducts = [...productViews.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([productId, views]) => ({ productId, views }));
  doc.updatedAt = sdk.FieldValue.serverTimestamp();
  doc.eventCount = snap.size;

  await sdk.db.collection('analytics_daily').doc(day).set(doc, { merge: true });
  return { day, eventCount: snap.size, uniqueVisitors: doc.uniqueVisitors };
}

async function rollupMonth(month = istMonth()) {
  const sdk = await adminDb();
  if (!sdk) throw new Error('Firestore unavailable for analytics rollup');
  const start = `${month}-01`;
  const [year, mon] = month.split('-').map(Number);
  const next = mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, '0')}`;
  const endExclusive = `${next}-01`;
  const snap = await sdk.db.collection('analytics_events')
    .where('day', '>=', start)
    .where('day', '<', endExclusive)
    .get();
  const sessions = new Set();
  let pageViews = 0;
  snap.docs.forEach((row) => {
    const data = row.data() || {};
    if (data.session_id) sessions.add(data.session_id);
    if (data.event_type === 'page_view') pageViews += 1;
  });
  const doc = {
    month,
    uniqueUsers: sessions.size,
    pageViews,
    eventCount: snap.size,
    updatedAt: sdk.FieldValue.serverTimestamp(),
  };
  await sdk.db.collection('analytics_monthly').doc(month).set(doc, { merge: true });
  return doc;
}

async function rollupAnalyticsDays(lookbackDays = 3) {
  const days = [];
  const now = new Date();
  for (let i = 0; i < lookbackDays; i += 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(istDay(d));
  }
  const results = [];
  for (const day of days) {
    results.push(await rollupDay(day));
  }
  const month = await rollupMonth();
  return { days: results, month };
}

module.exports = { rollupAnalyticsDays, rollupDay, rollupMonth, istDay, istMonth };
