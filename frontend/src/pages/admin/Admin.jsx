import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Package, ShoppingBag, Boxes, Users, Tag, LogOut, TrendingUp, Search, Plus, Edit3, Trash2 } from 'lucide-react';
import { PRODUCTS, HAMPERS } from '@/data/mockCatalog';
import { inr } from '@/lib/utils';

const SIDE = [
  { to: '/admin', label: 'Dashboard', Ic: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', Ic: Package },
  { to: '/admin/orders', label: 'Orders', Ic: ShoppingBag },
  { to: '/admin/inventory', label: 'Inventory', Ic: Boxes },
  { to: '/admin/customers', label: 'Customers', Ic: Users },
  { to: '/admin/offers', label: 'Coupons / Offers', Ic: Tag },
];

// Admin guard — silent redirect for non-admin. Never reveal admin surface exists.
export function AdminLayout() {
  const { isAuthed, isAdmin, logout, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  // Silent redirect: send to customer login with returnTo, no message that admin exists.
  React.useEffect(() => {
    if (loading) return;
    if (!isAuthed || !isAdmin) nav('/login', { replace: true, state: { from: loc.pathname } });
  }, [isAuthed, isAdmin, loading, nav, loc.pathname]);
  if (!isAuthed || !isAdmin) return null;
  return (
    <div className="min-h-screen bg-cream-100">
      <div className="grid md:grid-cols-[240px_1fr] min-h-screen">
        <aside className="bg-brand-900 text-white p-4 md:min-h-screen">
          <div className="flex items-center gap-2 mb-6"><div className="w-9 h-9 rounded-full bg-gold-500 grid place-items-center font-display font-bold">S</div><div><div className="font-display text-lg">Sukhmal</div><div className="text-[10px] tracking-widest opacity-70">ADMIN CONSOLE</div></div></div>
          <nav className="space-y-1">
            {SIDE.map(({ to, label, Ic, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'bg-white/15 text-white' : 'text-cream-200/80 hover:bg-white/10 hover:text-white'}`}><Ic size={16} /> {label}</NavLink>
            ))}
          </nav>
          <div className="absolute bottom-4 md:static md:mt-8">
            <button onClick={() => { logout(); nav('/'); }} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-cream-200/80 hover:text-white hover:bg-white/10"><LogOut size={16} /> Log out</button>
          </div>
        </aside>
        <main className="p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const stats = [
    { l: 'Total Revenue (MTD)', v: '₹12,45,600', c: '+18%', Ic: TrendingUp },
    { l: 'Orders (MTD)', v: '412', c: '+22%', Ic: ShoppingBag },
    { l: 'Products Live', v: `${PRODUCTS.length + HAMPERS.length}`, c: '', Ic: Package },
    { l: 'Customers', v: '3,241', c: '+156', Ic: Users },
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-6"><h1 className="font-display text-2xl font-bold text-brand-900">Dashboard</h1><div className="text-sm text-ink-500">Jan 2025</div></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.l} className="sk-card p-5"><s.Ic size={22} className="text-brand-900" /><div className="text-[12px] text-ink-500 mt-2">{s.l}</div><div className="font-display font-bold text-brand-900 text-2xl mt-1">{s.v}</div>{s.c && <div className="text-[12px] text-[var(--sk-green-500)] font-semibold">{s.c} vs last month</div>}</div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="sk-card p-5"><div className="font-display font-bold text-brand-900 text-lg mb-3">Recent Orders</div><div className="space-y-2">{['ord_a1','ord_a2','ord_a3','ord_a4'].map((o, i) => (<div key={o} className="flex items-center justify-between text-sm py-1.5 border-b border-line last:border-0"><span className="font-mono text-brand-900">{o}</span><span className="sk-pill">{i % 2 === 0 ? 'confirmed' : 'shipped'}</span><span className="font-semibold">{inr(1200 + i * 400)}</span></div>))}</div></div>
        <div className="sk-card p-5"><div className="font-display font-bold text-brand-900 text-lg mb-3">Low Stock Alerts</div><div className="space-y-2">{PRODUCTS.slice(0, 4).map((p, i) => (<div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-line last:border-0"><span className="text-brand-900">{p.name}</span><span className={`sk-pill ${i < 2 ? 'bg-red-100 text-red-500' : 'bg-cream-300 text-brand-900'}`}>{i < 2 ? 'Out of stock' : `${8 + i * 3} left`}</span></div>))}</div></div>
      </div>
    </div>
  );
}

export function AdminProducts() {
  const [q, setQ] = useState('');
  const list = PRODUCTS.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="flex items-center justify-between mb-4"><h1 className="font-display text-2xl font-bold text-brand-900">Products</h1><button className="sk-btn-primary text-sm"><Plus size={14} /> Add Product</button></div>
      <div className="sk-card mb-4 p-3"><div className="relative max-w-sm"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." className="sk-input pl-9 !py-2" /></div></div>
      <div className="sk-card overflow-hidden">
        <div className="grid grid-cols-[60px_1fr_100px_80px_80px_100px] gap-3 items-center px-4 py-3 border-b border-line text-[11px] uppercase tracking-widest text-ink-500 bg-cream-200"><div>Img</div><div>Product</div><div>Category</div><div>Price</div><div>Stock</div><div>Actions</div></div>
        {list.map((p) => (
          <div key={p.id} className="grid grid-cols-[60px_1fr_100px_80px_80px_100px] gap-3 items-center px-4 py-3 border-b border-line last:border-0">
            <img src={p.images[0]} className="w-10 h-10 rounded-lg object-cover" alt="" />
            <div><div className="font-semibold text-brand-900 text-sm">{p.name}</div><div className="text-[11px] text-ink-500">{p.slug}</div></div>
            <div className="text-sm">{p.category}</div>
            <div className="font-semibold">{inr(p.price)}</div>
            <div><span className="sk-pill sk-pill-green">In Stock</span></div>
            <div className="flex gap-2"><button className="text-brand-900"><Edit3 size={14} /></button><button className="text-red-500"><Trash2 size={14} /></button></div>
          </div>
        ))}
      </div>
    </div>
  );
}

const ADMIN_ORDERS = [
  { id: 'ord_a1', customer: 'Priya Sharma', total: 1499, status: 'confirmed', date: 'Today 10:15 AM' },
  { id: 'ord_a2', customer: 'Rakesh Iyer',   total: 2499, status: 'packed',    date: 'Today 09:30 AM' },
  { id: 'ord_a3', customer: 'Nikita Verma', total: 899,  status: 'shipped',   date: 'Yesterday' },
  { id: 'ord_a4', customer: 'Arjun Mehta',   total: 3299, status: 'delivered', date: '2 days ago' },
  { id: 'ord_a5', customer: 'Sanya Kapoor', total: 1099, status: 'return_requested', date: '3 days ago' },
];

export function AdminOrders() {
  const [filter, setFilter] = useState('all');
  const list = ADMIN_ORDERS.filter((o) => filter === 'all' || o.status === filter);
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-brand-900 mb-4">Orders</h1>
      <div className="flex flex-wrap gap-2 mb-4">{['all','confirmed','packed','shipped','delivered','return_requested'].map((s) => (<button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-[13px] font-medium ${filter === s ? 'bg-brand-900 text-white' : 'bg-white border border-line-strong text-brand-900'}`}>{s}</button>))}</div>
      <div className="sk-card overflow-hidden">
        {list.map((o) => (
          <div key={o.id} className="grid grid-cols-[1fr_1fr_100px_140px_140px] gap-3 items-center px-4 py-3 border-b border-line last:border-0">
            <div><div className="font-mono font-semibold text-brand-900 text-sm">{o.id}</div><div className="text-[11px] text-ink-500">{o.date}</div></div>
            <div className="text-sm text-brand-900">{o.customer}</div>
            <div className="font-semibold">{inr(o.total)}</div>
            <span className="sk-pill">{o.status.replace('_',' ')}</span>
            <select defaultValue={o.status} className="sk-input !py-1.5 !text-sm">{['confirmed','packed','shipped','delivered','cancelled'].map((x) => <option key={x}>{x}</option>)}</select>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminInventory() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-brand-900 mb-4">Inventory</h1>
      <div className="sk-card overflow-hidden">
        <div className="grid grid-cols-[60px_1fr_100px_120px_140px] gap-3 items-center px-4 py-3 border-b border-line text-[11px] uppercase tracking-widest text-ink-500 bg-cream-200"><div>Img</div><div>Product</div><div>Stock</div><div>Threshold</div><div>Adjust</div></div>
        {PRODUCTS.map((p, i) => (
          <div key={p.id} className="grid grid-cols-[60px_1fr_100px_120px_140px] gap-3 items-center px-4 py-3 border-b border-line last:border-0">
            <img src={p.images[0]} className="w-10 h-10 rounded-lg object-cover" alt="" />
            <div className="text-sm font-semibold text-brand-900">{p.name}</div>
            <div><span className={`sk-pill ${i < 3 ? 'bg-red-100 text-red-500' : 'sk-pill-green'}`}>{i < 3 ? '0' : 20 + i}</span></div>
            <div className="text-sm text-ink-500">10</div>
            <div className="flex gap-1"><input type="number" defaultValue={0} className="sk-input !py-1.5 w-16 !text-sm" /><button className="sk-btn-primary text-[12px] !py-1.5 !px-3">Adjust</button></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminCustomers() {
  const rows = [
    { name: 'Priya Sharma', email: 'priya@example.com', orders: 12, ltv: 24500 },
    { name: 'Arjun Mehta', email: 'arjun@example.com', orders: 8, ltv: 32000 },
    { name: 'Nikita Verma', email: 'nikita@example.com', orders: 5, ltv: 8400 },
    { name: 'Rakesh Iyer', email: 'rakesh@example.com', orders: 20, ltv: 41000 },
  ];
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-brand-900 mb-4">Customers</h1>
      <div className="sk-card overflow-hidden">
        <div className="grid grid-cols-4 gap-3 px-4 py-3 border-b border-line text-[11px] uppercase tracking-widest text-ink-500 bg-cream-200"><div>Name</div><div>Email</div><div>Orders</div><div>Lifetime Value</div></div>
        {rows.map((r) => (
          <div key={r.email} className="grid grid-cols-4 gap-3 px-4 py-3 border-b border-line last:border-0">
            <div className="font-semibold text-brand-900">{r.name}</div>
            <div className="text-sm text-ink-600">{r.email}</div>
            <div>{r.orders}</div>
            <div className="font-semibold">{inr(r.ltv)}</div>
          </div>
        ))}
      </div>
      <div className="text-[12px] text-ink-500 mt-2">Note: PII (payment cards, passwords) is never stored on our servers.</div>
    </div>
  );
}

export function AdminOffers() {
  const [coupons, setCoupons] = useState([
    { code: 'WELCOME10', type: '%', value: 10, min: 0, exp: '2025-12-31', active: true },
    { code: 'FESTIVE500', type: '₹', value: 500, min: 1500, exp: '2025-11-30', active: true },
    { code: 'BULK25', type: '%', value: 25, min: 10000, exp: '2026-03-31', active: false },
  ]);
  return (
    <div>
      <div className="flex items-center justify-between mb-4"><h1 className="font-display text-2xl font-bold text-brand-900">Coupons / Offers</h1><button className="sk-btn-primary text-sm"><Plus size={14} /> Create Coupon</button></div>
      <div className="sk-card overflow-hidden">
        <div className="grid grid-cols-6 gap-3 px-4 py-3 border-b border-line text-[11px] uppercase tracking-widest text-ink-500 bg-cream-200"><div>Code</div><div>Type</div><div>Value</div><div>Min Order</div><div>Expiry</div><div>Status</div></div>
        {coupons.map((c) => (
          <div key={c.code} className="grid grid-cols-6 gap-3 px-4 py-3 border-b border-line last:border-0 items-center">
            <div className="font-mono font-semibold text-brand-900">{c.code}</div>
            <div>{c.type === '%' ? 'Percent' : 'Flat'}</div>
            <div>{c.type === '%' ? `${c.value}%` : inr(c.value)}</div>
            <div>{c.min ? inr(c.min) : 'None'}</div>
            <div>{c.exp}</div>
            <div><span className={`sk-pill ${c.active ? 'sk-pill-green' : 'bg-red-100 text-red-500'}`}>{c.active ? 'Active' : 'Inactive'}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
