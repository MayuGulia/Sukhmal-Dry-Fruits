import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell,
  Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { CalendarDays } from 'lucide-react';
import { inr } from '@/lib/utils';
import { adminApi } from '@/lib/adminApi';
import { canonicalStatus } from '@/lib/orderStatus';

const RANGES = [
  { id: '7', label: 'Last 7 days' },
  { id: '30', label: 'Last 30 days' },
  { id: '90', label: 'Last 90 days' },
];

const PIE_COLORS = ['#4A2E1E', '#D4A762', '#8B6B4A', '#C45C4A'];
const GOLD = '#D4A762';
const ESPRESSO = '#4A2E1E';

function rangeDates(id) {
  const to = new Date();
  const from = new Date();
  const days = Number(id) || 30;
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString(), days };
}

function paid(order) {
  return order.paymentStatus === 'paid';
}

function dayKey(iso) {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function stockHealth(products) {
  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;
  (products || []).forEach((p) => {
    const variants = p.weightVariants || [];
    if (!variants.length) {
      const stock = typeof p.stock === 'number' ? p.stock : (p.inStock === false ? 0 : 20);
      if (stock <= 0) outOfStock += 1;
      else if (stock <= 5) lowStock += 1;
      else inStock += 1;
      return;
    }
    variants.forEach((v) => {
      const stock = typeof v.stock === 'number' ? v.stock : 0;
      if (stock <= 0) outOfStock += 1;
      else if (stock <= 5) lowStock += 1;
      else inStock += 1;
    });
  });
  return { inStock, lowStock, outOfStock };
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-xl border border-line bg-white px-4 py-4">
      <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-ink-500">{label}</div>
      <div className="font-display font-bold text-2xl mt-2 text-brand-900">{value}</div>
    </div>
  );
}

function ChartCard({ title, children, tall }) {
  return (
    <section className="rounded-xl border border-line bg-white p-4">
      <h2 className="text-[12px] font-bold tracking-[0.16em] uppercase mb-3">{title}</h2>
      <div className={tall ? 'h-72' : 'h-56'}>{children}</div>
    </section>
  );
}

export function AdminAnalytics() {
  const [tab, setTab] = useState('business');
  const [range, setRange] = useState('30');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [daily, setDaily] = useState([]);
  const [monthUsers, setMonthUsers] = useState(0);
  const [err, setErr] = useState('');

  useEffect(() => {
    setErr('');
    const { from, to } = rangeDates(range);
    const u1 = adminApi.subscribeOrders(
      { from, to },
      setOrders,
      (e) => setErr(e?.message || 'Could not load orders.'),
    );
    const u2 = adminApi.subscribeProducts(
      { activeOnly: false },
      (rows) => setProducts(rows),
      (e) => setErr(e?.message || 'Could not load products.'),
    );
    adminApi.analyticsDaily(from, to).then(setDaily).catch((e) => {
      setDaily([]);
      setErr((prev) => prev || e?.message || 'Could not load website analytics yet.');
    });
    adminApi.analyticsMonthly().then((row) => {
      setMonthUsers(Number(row?.uniqueUsers) || 0);
    }).catch(() => setMonthUsers(0));
    return () => { u1?.(); u2?.(); };
  }, [range]);

  const business = useMemo(() => {
    const { from, to } = rangeDates(range);
    const fromD = new Date(from);
    const toD = new Date(to);
    const inRange = orders.filter((o) => {
      const t = new Date(o.createdAt);
      return t >= fromD && t <= toD;
    });
    const paidOrders = inRange.filter(paid);
    const revenue = paidOrders.reduce((s, o) => s + (o.total || 0), 0);
    const trendMap = new Map();
    paidOrders.forEach((o) => {
      const day = dayKey(o.createdAt);
      const row = trendMap.get(day) || { day, revenue: 0, orders: 0 };
      row.revenue += o.total || 0;
      row.orders += 1;
      trendMap.set(day, row);
    });
    const trend = [...trendMap.values()].sort((a, b) => a.day.localeCompare(b.day));
    const productMap = new Map();
    paidOrders.forEach((o) => {
      (o.items || []).forEach((it) => {
        const id = String(it.productId || it.id || it.name || '').trim();
        if (!id) return;
        const row = productMap.get(id) || { name: it.name || id, units: 0, revenue: 0 };
        const qty = Number(it.qty) || 0;
        row.units += qty;
        row.revenue += (Number(it.price) || 0) * qty;
        productMap.set(id, row);
      });
    });
    const top = [...productMap.values()].sort((a, b) => b.units - a.units).slice(0, 5);
    const statusMap = { Pending: 0, Shipped: 0, Delivered: 0, Cancelled: 0 };
    inRange.forEach((o) => {
      const status = canonicalStatus(o.status || o.orderStatus);
      if (status === 'Cancelled') statusMap.Cancelled += 1;
      else if (status === 'Delivered') statusMap.Delivered += 1;
      else if (status === 'Shipped' || status === 'Out for Delivery') statusMap.Shipped += 1;
      else statusMap.Pending += 1;
    });
    const statusRows = Object.entries(statusMap).map(([name, value]) => ({ name, value }));
    return {
      revenue,
      orderCount: inRange.length,
      aov: paidOrders.length ? Math.round(revenue / paidOrders.length) : 0,
      ...stockHealth(products),
      trend,
      top,
      statusRows,
    };
  }, [orders, products, range]);

  const web = useMemo(() => {
    const pageViews = daily.reduce((s, d) => s + (Number(d.pageViews) || 0), 0);
    const unique = daily.reduce((s, d) => s + (Number(d.uniqueVisitors) || 0), 0);
    const returning = daily.reduce((s, d) => s + (Number(d.returningVisitors) || 0), 0);
    const views = daily.reduce((s, d) => s + (Number(d.productViews) || 0), 0);
    const carts = daily.reduce((s, d) => s + (Number(d.addToCart) || 0), 0);
    const checkouts = daily.reduce((s, d) => s + (Number(d.checkoutStarted) || 0), 0);
    const placed = daily.reduce((s, d) => s + (Number(d.orderPlaced) || 0), 0);
    const hamper = daily.reduce((s, d) => s + (Number(d.hamperBuilderStarted) || 0), 0);
    const wishlist = daily.reduce((s, d) => s + (Number(d.wishlistAdd) || 0), 0);
    const ai = daily.reduce((s, d) => s + (Number(d.aiWidgetUsed) || 0), 0);
    const productMap = new Map();
    daily.forEach((d) => {
      (d.topProducts || []).forEach((row) => {
        const id = row.productId;
        productMap.set(id, (productMap.get(id) || 0) + (Number(row.views) || 0));
      });
    });
    const topViewed = [...productMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, viewsCount]) => ({ name, views: viewsCount }));
    const funnel = [
      { name: 'Product view', value: views },
      { name: 'Add to cart', value: carts },
      { name: 'Checkout', value: checkouts },
      { name: 'Order placed', value: placed },
    ];
    return {
      unique,
      pageViews,
      returning,
      retention: unique ? Math.round((returning / unique) * 1000) / 10 : 0,
      views,
      carts,
      cartRate: views ? Math.round((carts / views) * 1000) / 10 : 0,
      hamper,
      wishlist,
      ai,
      topViewed,
      funnel,
      empty: !daily.length,
    };
  }, [daily]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl md:text-[2.1rem] font-bold text-brand-900">Analytics</h1>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm">
            <CalendarDays size={15} /> Date range
          </span>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="sk-input !py-2 !w-auto"
          >
            {RANGES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-5 mb-6">
        {[
          { id: 'business', label: 'Business Analytics' },
          { id: 'website', label: 'Website Analytics' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-3 py-1.5 rounded-full text-[13px] font-medium ${
              tab === item.id ? 'bg-brand-900 text-white' : 'bg-white border border-line text-brand-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {err && (
        <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{err}</p>
      )}

      {tab === 'business' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <MetricCard label="Revenue" value={inr(business.revenue)} />
            <MetricCard label="Orders" value={String(business.orderCount)} />
            <MetricCard label="Avg order" value={inr(business.aov)} />
            <MetricCard label="In stock" value={String(business.inStock)} />
            <MetricCard label="Low stock" value={String(business.lowStock)} />
            <MetricCard label="Out of stock" value={String(business.outOfStock)} />
          </div>

          <ChartCard title="Revenue trend">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={business.trend}>
                <CartesianGrid stroke="#E8DFD3" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => inr(v)} />
                <Line type="monotone" dataKey="revenue" stroke={ESPRESSO} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid lg:grid-cols-2 gap-4">
            <section className="rounded-xl border border-line bg-white overflow-hidden">
              <div className="px-4 py-3 text-[12px] font-bold tracking-[0.16em] uppercase border-b border-line">Top 5 selling products</div>
              <div className="grid grid-cols-[1.6fr_0.6fr_0.8fr] gap-2 px-4 py-2.5 text-[11px] uppercase tracking-widest text-ink-500 border-b border-line">
                <div>Product</div><div>Units</div><div>Revenue</div>
              </div>
              {business.top.map((row) => (
                <div key={row.name} className="grid grid-cols-[1.6fr_0.6fr_0.8fr] gap-2 px-4 py-3 border-b border-line last:border-0 text-sm">
                  <div className="font-medium">{row.name}</div>
                  <div>{row.units}</div>
                  <div className="font-semibold">{inr(row.revenue)}</div>
                </div>
              ))}
              {!business.top.length && <div className="px-4 py-8 text-center text-ink-500 text-sm">No paid orders in this range.</div>}
            </section>

            <ChartCard title="Order status">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={business.statusRows} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78}>
                    {business.statusRows.map((row, i) => (
                      <Cell key={row.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {web.empty && (
            <p className="text-sm text-ink-600 bg-[#F3EBE1] border border-line rounded-xl px-4 py-3">
              Website events will show here after customers browse the live site. Daily rollup fills this tab automatically.
            </p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <MetricCard label="Clicks (page views)" value={String(web.pageViews)} />
            <MetricCard label="Users this month" value={String(monthUsers)} />
            <MetricCard label="Unique visitors" value={String(web.unique)} />
            <MetricCard label="Returning" value={String(web.returning)} />
            <MetricCard label="Add-to-cart rate" value={`${web.cartRate}%`} />
            <MetricCard label="Hamper starts" value={String(web.hamper)} />
          </div>

          <ChartCard title="Cart-to-checkout funnel" tall>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={web.funnel} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid stroke="#E8DFD3" strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill={GOLD} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid lg:grid-cols-2 gap-4">
            <section className="rounded-xl border border-line bg-white overflow-hidden">
              <div className="px-4 py-3 text-[12px] font-bold tracking-[0.16em] uppercase border-b border-line">Top viewed products</div>
              {web.topViewed.map((row) => (
                <div key={row.name} className="flex items-center justify-between px-4 py-3 border-b border-line last:border-0 text-sm">
                  <span>{row.name}</span>
                  <span className="font-semibold">{row.views}</span>
                </div>
              ))}
              {!web.topViewed.length && <div className="px-4 py-8 text-center text-ink-500 text-sm">No product views yet.</div>}
            </section>
            <div className="grid grid-cols-1 gap-3">
              <MetricCard label="Wishlist adds" value={String(web.wishlist)} />
              <MetricCard label="Checkout started" value={String(web.funnel[2]?.value || 0)} />
              <MetricCard label="Orders placed" value={String(web.funnel[3]?.value || 0)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
