import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package, Sparkles, Wallet, Settings, LogOut,
  Search, Heart, ExternalLink, ChevronDown, CalendarDays,
  User, Truck, Leaf, Award, Hand, MapPin,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { BrandLockup } from '@/components/brand/BrandSeal';
import { inr } from '@/lib/utils';
import { adminApi } from '@/lib/adminApi';
import { productInStock } from '@/lib/commerceStore';
import { AiInventoryBar } from './AiInventoryBar';

const SIDE = [
  { to: '/admin', label: 'Dashboard', Ic: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', Ic: ShoppingBag },
  { to: '/admin/products', label: 'Products', Ic: Package },
  { to: '/admin/ai-inventory', label: 'AI Inventory', Ic: Sparkles },
  { to: '/admin/payments', label: 'Payments', Ic: Wallet },
  { to: '/admin/settings', label: 'Settings', Ic: Settings },
];

const STATUS_OPTS = ['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'pending_cod'];
const RANGE_OPTS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
];

function rangeDates(id) {
  const to = new Date();
  const from = new Date();
  if (id === 'week') from.setDate(from.getDate() - 7);
  else if (id === 'month') from.setDate(1);
  else from.setHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
}

function formatLong(d = new Date()) {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/ /g, ' ');
}

function statusLabel(s) {
  return String(s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function payLabel(m) {
  if (m === 'cod') return 'Cod';
  if (m === 'whatsapp') return 'Whatsapp';
  if (m === 'razorpay') return 'Razorpay';
  return m || '—';
}

export function AdminLayout() {
  const { isAuthed, isAdmin, logout, loading, user } = useAuth();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState(null);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isAuthed || !isAdmin) nav('/', { replace: true });
  }, [isAuthed, isAdmin, loading, nav]);

  useEffect(() => {
    if (!q.trim()) {
      setHits(null);
      return undefined;
    }
    const t = setTimeout(() => {
      adminApi.search(q).then(setHits).catch(() => setHits(null));
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  if (loading || !isAuthed || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-brand-900">
      <div className="bg-[var(--sk-espresso)] text-cream-200 text-[12px]">
        <div className="sk-container flex items-center justify-between h-9">
          <div className="hidden md:flex items-center gap-5 min-w-0">
            {[
              [Truck, 'Free Delivery on Orders Above ₹999'],
              [Leaf, '100% Natural'],
              [Award, 'Premium Quality'],
              [Hand, 'Handpicked with Care'],
            ].map(([Icon, label]) => (
              <span key={label} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <Icon size={13} className="text-gold-400" /> {label}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-5 ml-auto">
            <Link to="/store-locator" className="inline-flex items-center gap-1.5 hover:text-white">
              <MapPin size={13} className="text-gold-400" /> Store Locator
            </Link>
            <button
              type="button"
              onClick={() => { logout(); nav('/login'); }}
              className="inline-flex items-center gap-1.5 hover:text-white"
            >
              <LogOut size={13} className="text-gold-400" /> Logout
            </button>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-line">
        <div className="sk-container flex items-center h-[4.75rem] gap-4">
          <BrandLockup sealSize={52} showTagline />
          <form
            onSubmit={(e) => e.preventDefault()}
            className="relative flex-1 max-w-2xl mx-auto"
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for orders, products, customers..."
              className="sk-input !rounded-full !py-3 pr-14 pl-6 w-full shadow-sk-sm"
            />
            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-[var(--sk-espresso)] text-gold-300 grid place-items-center">
              <Search size={16} />
            </span>
            {hits && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white border border-line rounded-xl shadow-sk-lg overflow-hidden z-50 text-sm">
                {['orders', 'products', 'customers'].map((k) => (
                  <div key={k} className="border-b border-line last:border-0">
                    <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-ink-500 bg-cream-100">{k}</div>
                    {(hits[k] || []).length === 0 && <div className="px-3 py-2 text-ink-400">No matches</div>}
                    {(hits[k] || []).map((row, i) => (
                      <div key={i} className="px-3 py-2 hover:bg-cream-100">
                        {k === 'orders' && <span>#{row.orderId} · {row.recipientName}</span>}
                        {k === 'products' && <span>{row.name}</span>}
                        {k === 'customers' && <span>{row.name} · {row.phone}</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </form>
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/wishlist" className="p-2 text-brand-900" aria-label="Wishlist"><Heart size={20} /></Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--sk-espresso)] text-white text-sm font-semibold px-4 py-2.5 hover:bg-brand-800"
            >
              Visit Website <ExternalLink size={14} />
            </Link>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenu((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-2 text-sm font-semibold"
              >
                <User size={16} /> Admin <ChevronDown size={14} />
              </button>
              {menu && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-line rounded-xl shadow-sk-md overflow-hidden z-50">
                  <div className="px-3 py-2 text-[12px] text-ink-500 border-b border-line">{user?.email}</div>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-cream-100"
                    onClick={() => { logout(); nav('/login'); }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="sk-container">
        <nav className="lg:hidden flex gap-2 overflow-x-auto py-3 scrollbar-none border-b border-line">
          {SIDE.map(({ to, label, Ic, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-full text-[13px] font-medium ${
                  isActive ? 'bg-[#F3EBE1] text-[var(--sk-brown-900)]' : 'bg-white border border-line text-ink-600'
                }`
              }
            >
              <Ic size={15} strokeWidth={1.75} /> {label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="sk-container grid grid-cols-1 lg:grid-cols-[210px_1fr] gap-0 min-h-[calc(100vh-8rem)]">
        <aside className="py-6 pr-4 border-r border-line hidden lg:block">
          <nav className="space-y-1">
            {SIDE.map(({ to, label, Ic, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium ${
                    isActive ? 'bg-[#F3EBE1] text-[var(--sk-brown-900)]' : 'text-ink-600 hover:bg-cream-100'
                  }`
                }
              >
                <Ic size={18} strokeWidth={1.75} /> {label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => { logout(); nav('/login'); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-ink-600 hover:bg-cream-100 w-full"
            >
              <LogOut size={18} strokeWidth={1.75} /> Logout
            </button>
          </nav>
        </aside>
        <main className="py-6 lg:pl-8 pb-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [range, setRange] = useState('today');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [liveErr, setLiveErr] = useState('');

  const reload = () => {
    const { from, to } = rangeDates(range);
    adminApi.stats(from, to).then(setStats).catch((err) => setLiveErr(err.message));
    adminApi.orders({ status: statusFilter, from, to }).then(setOrders).catch(() => setOrders([]));
    adminApi.products({ limit: 6, activeOnly: false }).then(setProducts).catch(() => setProducts([]));
  };

  useEffect(() => {
    setLiveErr('');
    const { from, to } = rangeDates(range);
    return adminApi.subscribeDashboard(
      { from, to, status: statusFilter },
      {
        onStats: setStats,
        onOrders: setOrders,
        onProducts: setProducts,
        onError: (err) => setLiveErr(err?.message || 'Could not load live admin data.'),
      },
    );
  }, [range, statusFilter]);

  const cards = [
    { l: 'Revenue Today', v: inr(stats?.revenueToday || 0) },
    { l: 'Revenue Month', v: inr(stats?.revenueMonth || 0) },
    { l: 'Total Orders', v: String(stats?.totalOrders ?? 0) },
    { l: 'Pending', v: String(stats?.pending ?? 0) },
    { l: 'In Stock', v: String(stats?.inStock ?? 0) },
    { l: 'Out of Stock', v: String(stats?.outOfStock ?? 0) },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl md:text-[2.1rem] font-bold text-brand-900">Admin Dashboard</h1>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm">
            <CalendarDays size={15} /> {formatLong()}
          </span>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="sk-input !py-2 !w-auto"
          >
            {RANGE_OPTS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {liveErr && (
        <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {liveErr}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mt-6">
        {cards.map((c) => (
          <div key={c.l} className="rounded-xl border border-line bg-white px-4 py-4">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-ink-500">{c.l}</div>
            <div className="font-display font-bold text-2xl mt-2 text-brand-900">{c.v}</div>
          </div>
        ))}
      </div>

      <AiInventoryBar onApplied={reload} />

      <section className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[12px] font-bold tracking-[0.16em] uppercase">Orders</h2>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sk-input !py-1.5 !w-auto text-sm">
            <option value="all">All statuses</option>
            {STATUS_OPTS.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </select>
        </div>
        <div className="rounded-xl border border-line bg-white overflow-hidden">
          <div className="grid grid-cols-[1fr_1.3fr_1fr_0.8fr_1.1fr] gap-2 px-4 py-2.5 text-[11px] uppercase tracking-widest text-ink-500 border-b border-line">
            <div>Order</div><div>Recipient</div><div>Payment</div><div>Total</div><div>Status</div>
          </div>
          {orders.map((o) => (
            <div key={o.orderId} className="grid grid-cols-[1fr_1.3fr_1fr_0.8fr_1.1fr] gap-2 px-4 py-3 border-b border-line last:border-0 items-center text-sm">
              <div className="font-mono text-brand-900">#{o.orderId}</div>
              <div>
                <div className="font-medium">{o.recipientName}</div>
                <div className="text-[12px] text-ink-500">{o.recipientPhone}</div>
              </div>
              <div>{payLabel(o.paymentMethod)}</div>
              <div className="font-semibold">{inr(o.total)}</div>
              <select
                value={o.orderStatus}
                onChange={(e) => {
                  const next = e.target.value;
                  adminApi.setStatus(o.orderId, next).catch((err) => {
                    setLiveErr(err?.message || 'Could not update order status.');
                    e.target.value = o.orderStatus;
                  });
                }}
                className="sk-input !py-1.5 !text-[13px]"
              >
                {STATUS_OPTS.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
            </div>
          ))}
          {!orders.length && <div className="px-4 py-8 text-center text-ink-500 text-sm">No orders yet.</div>}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[12px] font-bold tracking-[0.16em] uppercase">Products ({products.length})</h2>
          <Link to="/admin/products" className="text-sm font-semibold text-brand-900 hover:text-brand-700">View All Products →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {products.map((p) => {
            const pack = p.weightVariants?.find((v) => /500/i.test(v.weight)) || p.weightVariants?.[0];
            const ok = productInStock(p);
            return (
              <div key={p.id} className="rounded-xl border border-line bg-white overflow-hidden">
                <div className="aspect-square bg-cream-200">
                  <img src={p.images?.[0]} alt={p.name} className="w-full h-full object-contain p-2" />
                </div>
                <div className="p-3">
                  <div className="font-display font-bold text-[14px] leading-tight line-clamp-2">
                    {p.name}{pack?.weight ? ` (${pack.weight})` : ''}
                  </div>
                  <div className="text-sm font-semibold mt-1">{inr(pack?.price ?? p.price)}</div>
                  <span className={`mt-2 inline-flex text-[10px] font-bold tracking-wide px-2 py-0.5 rounded ${ok ? 'bg-[#D9F0D2] text-[#2E7D32]' : 'bg-red-100 text-red-600'}`}>
                    {ok ? 'IN STOCK' : 'OUT OF STOCK'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {!products.length && (
          <div className="rounded-xl border border-line bg-white px-4 py-8 text-center text-ink-500 text-sm">
            No products yet.{' '}
            <Link to="/admin/products" className="font-semibold text-brand-900 underline">Open the products list</Link>
            {' '}to publish the catalog.
          </div>
        )}
      </section>
    </div>
  );
}

