import React, { useMemo, useState } from 'react';
import { Link, NavLink, useParams, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import Breadcrumb from '@/components/shared/Breadcrumb';
import {
  LayoutDashboard, Package, Heart, MapPin, CreditCard, Gift, Settings, LogOut,
  ShoppingBag, ChevronRight, Download, Trash2, Edit3, Plus, Award,
  TrendingUp, Bell, HelpCircle, Check, Truck, Shield, Leaf, ArrowLeft, RotateCcw,
  Eye, EyeOff, MoreVertical, Box,
} from 'lucide-react';
import { inr } from '@/lib/utils';
import { useUserOrders, useUserProfile } from '@/hooks/useAccountData';
import { saveUserAddresses, saveUserProfile } from '@/lib/orders';

const EMPTY_ADDRESS = { id: '', label: 'Home', name: '', line1: '', line2: '', pincode: '', phone: '', isDefault: false };

const STATUS_STYLE = {
  processing: 'bg-amber-50 text-amber-800 border border-amber-200',
  shipped: 'bg-sky-50 text-sky-700 border border-sky-200',
  delivered: 'bg-[var(--sk-green-100)] text-[var(--sk-green-500)] border border-[var(--sk-green-100)]',
  cancelled: 'bg-neutral-100 text-neutral-500 border border-neutral-200',
};

const SIDEBAR_PRIMARY = [
  { to: '/account', label: 'My Dashboard', Ic: LayoutDashboard, end: true },
  { to: '/account/orders', label: 'My Orders', Ic: Package },
  { to: '/wishlist', label: 'Wishlist', Ic: Heart },
  { to: '/account/addresses', label: 'Addresses', Ic: MapPin },
];

const SIDEBAR_SECONDARY = [
  { to: '/account/settings', label: 'Account Settings', Ic: Settings },
  { to: '/account/payment-methods', label: 'Payment Methods', Ic: CreditCard },
  { to: '/account/settings#notifications', label: 'Notifications', Ic: Bell },
  { to: '/contact-us', label: 'Help & Support', Ic: HelpCircle },
];

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'SK';
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS_STYLE[status] || STATUS_STYLE.processing}`}>
      {status}
    </span>
  );
}

function navClass(isActive) {
  return [
    'relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
    isActive
      ? 'bg-[#F8EDE3] text-brand-900 before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-full before:bg-brand-900'
      : 'text-brand-900 hover:bg-cream-200',
  ].join(' ');
}

/* ─── Layout ─────────────────────────────────────────────────── */

export function AccountLayout() {
  const { isAuthed, logout, loading } = useAuth();
  const { name, email } = useUserProfile();
  const nav = useNavigate();

  React.useEffect(() => {
    if (!loading && !isAuthed) nav('/login?return=/account', { state: { from: '/account', returnTo: '/account' } });
  }, [isAuthed, loading, nav]);

  if (loading) {
    return (
      <div className="sk-container py-20 text-center text-ink-500 text-sm">Loading your account…</div>
    );
  }
  if (!isAuthed) return null;

  const displayName = name || 'Guest';
  const displayEmail = email || '';

  return (
    <div className="min-h-[60vh] bg-[#FBF7F2]">
      <div className="sk-container pt-6 md:pt-8 pb-2">
        <Breadcrumb items={[{ label: 'My Account' }]} />
      </div>

      <div className="sk-container py-6 md:py-10 grid lg:grid-cols-[260px_1fr] gap-6 md:gap-8">
        <aside className="space-y-4 h-fit lg:sticky lg:top-24">
          <div className="sk-card p-5 !shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="h-14 w-14 rounded-full bg-brand-900 text-white grid place-items-center font-display font-bold text-lg shrink-0">
                {initials(displayName)}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-brand-900 truncate">{displayName}</div>
                <div className="text-[12px] text-ink-500 truncate mt-0.5">{displayEmail || 'No email on file'}</div>
                <Link to="/account/settings" className="text-[12px] font-semibold text-brand-700 hover:underline mt-1 inline-block">
                  Edit Profile
                </Link>
              </div>
            </div>
          </div>

          <nav className="sk-card p-2.5 !shadow-sm">
            <div className="px-3 pt-2 pb-1.5 text-[11px] uppercase tracking-widest text-ink-400 font-semibold">My Account</div>
            {SIDEBAR_PRIMARY.map(({ to, label, Ic, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => navClass(isActive)}>
                <Ic size={16} strokeWidth={1.75} className="shrink-0" /> {label}
              </NavLink>
            ))}

            <div className="my-2 mx-2 border-t border-line" />

            {SIDEBAR_SECONDARY.map(({ to, label, Ic }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => navClass(isActive && !to.includes('#'))}
              >
                <Ic size={16} strokeWidth={1.75} className="shrink-0" /> {label}
              </NavLink>
            ))}

            <div className="my-2 mx-2 border-t border-line" />

            <button
              type="button"
              onClick={() => { logout(); nav('/login'); }}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50"
            >
              <LogOut size={16} /> Logout
            </button>
          </nav>
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

/* ─── Dashboard (mock 18) ────────────────────────────────────── */

export function Dashboard() {
  const { name, addresses } = useUserProfile();
  const { orders, loading } = useUserOrders();
  const { ids } = useWishlist();
  const first = (name || 'there').split(' ')[0];
  const wishlistCount = ids.length;
  const recent = orders.slice(0, 3);

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display font-bold text-brand-900 text-3xl md:text-[2.15rem] leading-tight">
          My Account Dashboard
        </h1>
        <p className="text-ink-600 mt-2 text-sm md:text-base">
          Welcome back, {first}! Here&apos;s what&apos;s happening with your account.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { Ic: Package, iconClass: 'text-brand-900 bg-[#F3E5D7]', n: loading ? '…' : `${orders.length} Total Orders`, l: 'My Orders', to: '/account/orders', cta: 'View All Orders' },
          { Ic: Heart, iconClass: 'text-red-500 bg-red-50', n: `${wishlistCount} Saved Items`, l: 'Wishlist', to: '/wishlist', cta: 'View Wishlist' },
          { Ic: MapPin, iconClass: 'text-[var(--sk-green-500)] bg-[var(--sk-green-100)]', n: `${addresses.length} Saved Addresses`, l: 'Addresses', to: '/account/addresses', cta: 'Manage Addresses' },
        ].map(({ Ic, iconClass, n, l, to, cta }) => (
          <Link key={l} to={to} className="sk-card p-5 !shadow-sm hover:!shadow-md transition-shadow group">
            <div className={`h-10 w-10 rounded-xl grid place-items-center mb-3 ${iconClass}`}>
              <Ic size={20} strokeWidth={1.75} />
            </div>
            <div className="text-[12px] uppercase tracking-wider text-ink-500 font-semibold">{l}</div>
            <div className="font-display font-bold text-brand-900 text-xl mt-1">{n}</div>
            <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700 mt-3 group-hover:gap-1.5 transition-all">
              {cta} <ChevronRight size={14} />
            </span>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.55fr_1fr] gap-5 md:gap-6">
        <div className="sk-card p-5 md:p-6 !shadow-sm">
          <div className="flex items-center justify-between mb-5 gap-3">
            <h2 className="font-display font-bold text-brand-900 text-xl">Recent Orders</h2>
            <Link to="/account/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline shrink-0">
              View All Orders <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-0">
            {!loading && recent.length === 0 && (
              <p className="text-sm text-ink-500 py-6 text-center">No orders yet. When you place an order, it will show up here.</p>
            )}
            {recent.map((o) => (
              <div key={o.id} className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 border-b border-line last:border-0 first:pt-0 last:pb-0">
                <img src={o.image} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-brand-900 text-sm truncate">{o.title}</div>
                  <div className="text-[12px] text-ink-500 mt-0.5">
                    #{o.id} · {o.date}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <StatusBadge status={o.status} />
                    <span className="text-[12px] text-ink-600 font-medium">
                      {inr(o.total)} · {o.items} Item{o.items !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <Link
                  to={o.status === 'shipped' || o.status === 'processing' ? `/track-order?id=${o.id}` : `/account/orders/${o.id}`}
                  className="sk-btn-outline !py-2 !px-3.5 text-[12px] shrink-0 self-start sm:self-center"
                >
                  {o.status === 'shipped' || o.status === 'processing' ? 'Track Order' : 'View'}
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display font-bold text-brand-900 text-xl px-1 mb-3">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { to: '/category/all', Ic: ShoppingBag, t: 'Browse All Products', s: 'Explore dry fruits, nuts & more' },
              { to: '/build-hamper/budget', Ic: Gift, t: 'Build Your Own Hamper', s: 'Custom gift in 6 easy steps' },
              { to: '/track-order', Ic: Box, t: 'Track Your Order', s: 'Live status with Order ID' },
            ].map(({ to, Ic, t, s }) => (
              <Link key={t} to={to} className="sk-card p-4 flex items-center gap-3.5 !shadow-sm hover:!shadow-md transition-shadow">
                <div className="h-11 w-11 rounded-xl bg-[#F3E5D7] grid place-items-center text-brand-900 shrink-0">
                  <Ic size={18} strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-brand-900 text-sm">{t}</div>
                  <div className="text-[12px] text-ink-500 mt-0.5">{s}</div>
                </div>
                <ChevronRight size={16} className="text-ink-400 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-[#F3E5D7]/80 border border-[#E8D9C8] px-4 py-5 md:px-8 md:py-6 grid sm:grid-cols-3 gap-5">
        {[
          { Ic: Leaf, t: 'Premium Quality', s: 'Finest from around the world.' },
          { Ic: Shield, t: 'Secure Payments', s: '100% safe & secure checkout.' },
          { Ic: Truck, t: 'Pan India Delivery', s: 'Fast & reliable delivery across India.' },
        ].map(({ Ic, t, s }) => (
          <div key={t} className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-white grid place-items-center text-brand-900 shrink-0 shadow-sm">
              <Ic size={18} strokeWidth={1.75} />
            </div>
            <div>
              <div className="font-semibold text-brand-900 text-sm">{t}</div>
              <div className="text-[12px] text-ink-600 mt-0.5">{s}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── My Orders (mock 17) ────────────────────────────────────── */

export function MyOrders({ history = false }) {
  const [tab, setTab] = useState('all');
  const { orders, loading } = useUserOrders();
  const source = history
    ? orders.filter((o) => o.status === 'delivered' || o.status === 'cancelled')
    : orders;
  const filtered = useMemo(
    () => source.filter((o) => tab === 'all' || o.status === tab),
    [tab, source]
  );

  const tabs = history
    ? ['all', 'delivered', 'cancelled']
    : ['all', 'processing', 'shipped', 'delivered', 'cancelled'];

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-brand-900 text-3xl">
            {history ? 'Order History' : 'My Orders'}
          </h1>
          <p className="text-ink-600 mt-1.5 text-sm">
            {history
              ? 'Track and view details of all your orders.'
              : 'Track, manage and reorder your past purchases.'}
          </p>
        </div>
        {history && (
          <select
            value={tab}
            onChange={(e) => setTab(e.target.value)}
            className="sk-input !w-auto min-w-[140px] !py-2 text-sm"
            aria-label="Filter orders"
          >
            <option value="all">All Orders</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        )}
      </div>

      {!history && (
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? 'bg-brand-900 text-white'
                  : 'bg-white border border-line-strong text-brand-900 hover:bg-cream-200'
              }`}
            >
              {t === 'all' ? 'All Orders' : t}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3.5">
        {filtered.length === 0 && (
          <div className="sk-card p-10 text-center text-ink-600 text-sm !shadow-sm">
            {loading ? 'Loading orders…' : (tab === 'all' ? 'No orders yet.' : 'No orders in this filter.')}
          </div>
        )}
        {filtered.map((o) => (
          <div key={o.id} className="sk-card p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4 !shadow-sm">
            <img src={o.image} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-brand-900 text-sm md:text-[15px] truncate">{o.title}</div>
              <div className="text-[12px] text-ink-500 mt-0.5">
                #{o.id} · {o.date} · {o.items} item{o.items !== 1 ? 's' : ''}
              </div>
              <div className="mt-2 flex items-center gap-2.5 flex-wrap">
                <StatusBadge status={o.status} />
                <span className="font-display font-bold text-brand-900 text-[15px]">{inr(o.total)}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              {history ? (
                <Link to={`/account/orders/${o.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                  View Details <ChevronRight size={14} />
                </Link>
              ) : (
                <>
                  {(o.status === 'shipped' || o.status === 'processing') && (
                    <Link to={`/track-order?id=${o.id}`} className="sk-btn-outline !py-2 !px-3.5 text-[12px]">
                      Track Order
                    </Link>
                  )}
                  {o.status === 'delivered' && (
                    <button type="button" className="sk-btn-outline !py-2 !px-3.5 text-[12px]">
                      <RotateCcw size={13} /> Reorder
                    </button>
                  )}
                  {o.status === 'cancelled' ? (
                    <Link to={`/account/orders/${o.id}`} className="sk-btn-outline !py-2 !px-3.5 text-[12px]">
                      View Details
                    </Link>
                  ) : (
                    <Link to={`/account/orders/${o.id}`} className="sk-btn-primary !py-2 !px-3.5 text-[12px]">
                      View Details
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 text-sm text-ink-500">
        <span>
          Showing {filtered.length} of {source.length} Orders
        </span>
        {!history && (
          <Link to="/account/order-history" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
            View All Orders <ChevronRight size={14} />
          </Link>
        )}
      </div>
    </div>
  );
}

/* ─── Order Detail (mock 17 right panel) ─────────────────────── */

function TrackingTimeline({ steps }) {
  return (
    <div className="overflow-x-auto pb-1">
      <ol className="flex min-w-[520px] items-start gap-0">
        {steps.map((step, i) => {
          const last = i === steps.length - 1;
          return (
            <li key={step.label} className="flex-1 relative flex flex-col items-center text-center px-1">
              {!last && (
                <span
                  className={`absolute top-3 left-1/2 right-0 h-0.5 w-full ${step.done ? 'bg-[var(--sk-green-500)]' : 'bg-line-strong'}`}
                  aria-hidden
                />
              )}
              <span
                className={`relative z-10 h-6 w-6 rounded-full grid place-items-center text-white text-[10px] ${
                  step.done ? 'bg-[var(--sk-green-500)]' : 'bg-line-strong'
                }`}
              >
                {step.done ? <Check size={12} strokeWidth={3} /> : i + 1}
              </span>
              <div className="mt-2 text-[11px] font-semibold text-brand-900 leading-tight">{step.label}</div>
              <div className="text-[10px] text-ink-500 mt-0.5">{step.at}</div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function OrderDetail() {
  const { orderId } = useParams();
  const { orders, loading } = useUserOrders();
  const o = orders.find((x) => x.id === orderId);
  const [invoiceHint, setInvoiceHint] = useState(false);

  if (loading) {
    return <div className="sk-card p-10 text-center text-sm text-ink-500">Loading order…</div>;
  }
  if (!o) {
    return (
      <div className="sk-card p-10 text-center text-sm text-ink-600">
        We couldn’t find that order.
        <div className="mt-4"><Link to="/account/orders" className="sk-btn-primary text-sm">Back to orders</Link></div>
      </div>
    );
  }

  const downloadInvoice = () => {
    const blob = new Blob(
      [
        `Sukhmal Dry Fruits Korner\nINVOICE\n\nOrder: #${o.id}\nDate: ${o.date}\nTotal: ${inr(o.summary?.paid ?? o.total)}\n\nThank you for shopping with us.`,
      ],
      { type: 'text/plain' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${o.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setInvoiceHint(true);
    window.setTimeout(() => setInvoiceHint(false), 2500);
  };

  return (
    <div className="space-y-5">
      <Link to="/account/orders" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-900 hover:underline">
        <ArrowLeft size={14} /> Order Details
      </Link>

      <div className="sk-card p-5 md:p-6 !shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-display font-bold text-brand-900 text-xl md:text-2xl">Order #{o.id}</h1>
              <StatusBadge status={o.status} />
            </div>
            <div className="text-sm text-ink-500 mt-1">Placed {o.placedAt || o.date}</div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">Total Paid</div>
            <div className="font-display font-bold text-brand-900 text-2xl">{inr(o.summary?.paid ?? o.total)}</div>
          </div>
        </div>
      </div>

      <div className="sk-card p-5 md:p-6 !shadow-sm">
        <div className="font-semibold text-brand-900 mb-4">Order Items</div>
        <div className="space-y-3">
          {(o.lines || []).map((line) => (
            <div key={line.name} className="flex items-center gap-3 pb-3 border-b border-line last:border-0 last:pb-0">
              <img src={line.image} alt="" className="w-14 h-14 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-brand-900 text-sm">{line.name}</div>
                <div className="text-[12px] text-ink-500">{line.weight} · Qty {line.qty}</div>
              </div>
              <div className="font-display font-bold text-brand-900">{inr(line.price * line.qty)}</div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={downloadInvoice}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-line-strong bg-white px-4 py-3 text-sm font-semibold text-brand-900 hover:bg-cream-200 transition-colors"
        >
          <Download size={15} /> Download Invoice
        </button>
        {invoiceHint && (
          <p className="text-[12px] text-[var(--sk-green-500)] mt-2 text-center font-medium">
            Invoice downloaded.
          </p>
        )}
      </div>

      <div className="sk-card p-5 md:p-6 !shadow-sm">
        <div className="font-semibold text-brand-900 mb-5">Tracking Timeline</div>
        <TrackingTimeline steps={o.timeline || []} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="sk-card p-5 !shadow-sm">
          <div className="font-semibold text-brand-900 mb-3">Delivery Address</div>
          <div className="text-sm text-ink-600 leading-relaxed">
            <div className="font-semibold text-brand-900">{o.address?.name}</div>
            {o.address?.line1}<br />
            {o.address?.line2}<br />
            Pincode: {o.address?.pincode}<br />
            <span className="text-ink-500">{o.address?.phone}</span>
          </div>
        </div>
        <div className="sk-card p-5 !shadow-sm">
          <div className="font-semibold text-brand-900 mb-3">Order Summary</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-ink-600">Subtotal</span><span>{inr(o.summary?.subtotal ?? o.total)}</span></div>
            <div className="flex justify-between">
              <span className="text-ink-600">Shipping Charges</span>
              <span className="text-[var(--sk-green-500)] font-medium">
                {(o.summary?.shipping ?? 0) === 0 ? 'FREE' : inr(o.summary.shipping)}
              </span>
            </div>
            {(o.summary?.discount || 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-ink-600">Discount</span>
                <span className="text-[var(--sk-green-500)]">−{inr(o.summary.discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-2.5 font-bold text-brand-900 text-base">
              <span>Total Paid</span>
              <span>{inr(o.summary?.paid ?? o.total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {(o.status === 'shipped' || o.status === 'processing') && (
          <Link to={`/track-order?id=${o.id}`} className="sk-btn-primary text-sm">Track Order</Link>
        )}
        <button type="button" className="sk-btn-outline text-sm">
          <RotateCcw size={14} /> Reorder
        </button>
        {o.status === 'delivered' && (
          <Link to={`/account/orders/${o.id}/return`} className="sk-btn-outline text-sm">
            Return / Refund
          </Link>
        )}
        {o.status !== 'delivered' && o.status !== 'cancelled' && (
          <button type="button" className="sk-btn-outline text-sm !text-red-500 !border-red-400">
            Cancel Order
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Return ─────────────────────────────────────────────────── */

export function ReturnOrder() {
  const [reason, setReason] = useState('damaged');
  const [notes, setNotes] = useState('');
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="sk-card p-10 md:p-12 text-center max-w-lg mx-auto !shadow-sm">
        <div className="mx-auto h-14 w-14 rounded-full bg-[var(--sk-green-100)] grid place-items-center text-[var(--sk-green-500)]">
          <Check size={24} />
        </div>
        <div className="font-display text-2xl text-brand-900 font-bold mt-4">Return request submitted</div>
        <p className="text-ink-600 mt-2 text-sm">We&apos;ll review and respond within 24 hours.</p>
        <Link to="/account/orders" className="sk-btn-primary mt-6 inline-flex text-sm">Back to Orders</Link>
      </div>
    );
  }

  return (
    <div className="sk-card p-5 md:p-7 max-w-xl !shadow-sm">
      <h1 className="font-display font-bold text-brand-900 text-2xl">Request Return / Cancellation</h1>
      <p className="text-ink-600 text-sm mt-1.5">Please share a few details so we can process this quickly.</p>
      <div className="mt-5">
        <label className="font-semibold text-brand-900 text-sm">Reason</label>
        <select value={reason} onChange={(e) => setReason(e.target.value)} className="sk-input mt-2">
          {['damaged', 'wrong item', 'not fresh', 'changed mind', 'other'].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <div className="mt-4">
        <label className="font-semibold text-brand-900 text-sm">Additional notes</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="sk-input mt-2"
          placeholder="Anything else we should know?"
        />
      </div>
      <button type="button" onClick={() => setSent(true)} className="sk-btn-primary mt-5 text-sm">
        Submit Request
      </button>
    </div>
  );
}

/* ─── Addresses (mock 17 + 19) ───────────────────────────────── */

export function Addresses() {
  const { user, addresses } = useUserProfile();
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_ADDRESS);

  React.useEffect(() => {
    setList(addresses);
  }, [addresses]);

  const persist = async (next) => {
    setList(next);
    if (user?.uid) await saveUserAddresses(user.uid, next);
  };

  const openNew = () => {
    setForm({ ...EMPTY_ADDRESS, id: `a_${Date.now()}` });
    setEditing('new');
  };

  const openEdit = (a) => {
    setForm({ ...a });
    setEditing(a.id);
  };

  const save = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.line1.trim() || !form.pincode.trim()) return;
    let next = list.some((x) => x.id === form.id)
      ? list.map((x) => (x.id === form.id ? form : x))
      : [...list, form];
    if (form.isDefault) next = next.map((x) => ({ ...x, isDefault: x.id === form.id }));
    persist(next);
    setEditing(null);
  };

  const remove = (id) => persist(list.filter((x) => x.id !== id));

  const setDefault = (id) => persist(list.map((x) => ({ ...x, isDefault: x.id === id })));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display font-bold text-brand-900 text-3xl">Saved Addresses</h1>
          <p className="text-ink-600 mt-1.5 text-sm">Manage your saved addresses for faster checkout.</p>
        </div>
        <button type="button" onClick={openNew} className="sk-btn-primary text-sm shrink-0">
          <Plus size={14} /> Add New Address
        </button>
      </div>

      {editing && (
        <form onSubmit={save} className="sk-card p-5 md:p-6 mb-6 space-y-3 !shadow-sm">
          <div className="font-display font-bold text-brand-900 text-lg">
            {editing === 'new' ? 'Add New Address' : 'Edit Address'}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-ink-500">Label</label>
              <select
                className="sk-input mt-1"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              >
                {['Home', 'Office', 'Other'].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-ink-500">Full name</label>
              <input
                className="sk-input mt-1"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[12px] font-semibold text-ink-500">Address line 1</label>
              <input
                className="sk-input mt-1"
                value={form.line1}
                onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[12px] font-semibold text-ink-500">Address line 2</label>
              <input
                className="sk-input mt-1"
                value={form.line2}
                onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-ink-500">Pincode</label>
              <input
                className="sk-input mt-1"
                value={form.pincode}
                onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-ink-500">Phone</label>
              <input
                className="sk-input mt-1"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-brand-900 pt-1">
            <input
              type="checkbox"
              checked={!!form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              className="accent-[var(--sk-brown-900)]"
            />
            Set as default address
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="submit" className="sk-btn-primary text-sm">Save Address</button>
            <button type="button" onClick={() => setEditing(null)} className="sk-btn-outline text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.length === 0 && !editing && (
          <div className="sk-card p-8 text-sm text-ink-500 md:col-span-2">
            No saved addresses yet. Add one for faster checkout.
          </div>
        )}
        {list.map((a) => (
          <div key={a.id} className="sk-card p-5 flex flex-col !shadow-sm relative">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-bold text-brand-900 text-lg">{a.label}</span>
                {a.isDefault && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--sk-green-100)] text-[var(--sk-green-500)]">
                    Default
                  </span>
                )}
              </div>
              <button type="button" className="h-8 w-8 rounded-lg hover:bg-cream-200 grid place-items-center text-ink-400" aria-label="More">
                <MoreVertical size={16} />
              </button>
            </div>
            <div className="font-semibold text-brand-900 mt-3">{a.name}</div>
            <div className="text-sm text-ink-600 mt-1 leading-relaxed flex-1">
              {a.line1}{a.line2 ? `, ${a.line2}` : ''}
              <div className="mt-0.5">Pincode: {a.pincode}</div>
              <div className="text-[12px] text-ink-500 mt-1">{a.phone}</div>
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t border-line">
              <button type="button" onClick={() => openEdit(a)} className="sk-btn-outline !py-1.5 !px-3 text-[12px] flex-1">
                <Edit3 size={12} /> Edit
              </button>
              <button type="button" onClick={() => remove(a.id)} className="sk-btn-outline !py-1.5 !px-3 text-[12px] flex-1 !text-red-500 !border-red-300">
                <Trash2 size={12} /> Delete
              </button>
            </div>
            {!a.isDefault && (
              <button type="button" onClick={() => setDefault(a.id)} className="sk-btn-ghost text-[12px] mt-2 justify-center w-full">
                Make default
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Payment / Loyalty shells ───────────────────────────────── */

export function PaymentMethods() {
  return (
    <div>
      <h1 className="font-display font-bold text-brand-900 text-3xl mb-2">Payment Methods</h1>
      <p className="text-ink-600 text-sm mb-6">Cards are tokenized securely by our payment partner.</p>

      <div className="sk-card p-6 md:p-8 !shadow-sm">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-cream-300 grid place-items-center text-brand-900 shrink-0">
            <CreditCard size={22} strokeWidth={1.75} />
          </div>
          <div>
            <div className="font-semibold text-brand-900">No saved cards yet</div>
            <p className="text-sm text-ink-600 mt-1.5 max-w-md leading-relaxed">
              You haven&apos;t saved any payment methods. Cards are securely stored by Razorpay — you can add one during checkout.
            </p>
            <button type="button" className="sk-btn-outline text-sm mt-4" disabled>
              <Plus size={14} /> Add Card (coming soon)
            </button>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mt-4">
        {['UPI', 'Cards', 'Net Banking / Wallets'].map((m) => (
          <div key={m} className="sk-card p-4 text-center !shadow-sm">
            <div className="text-[12px] uppercase tracking-wider text-ink-400 font-semibold">Accepted</div>
            <div className="font-semibold text-brand-900 mt-1 text-sm">{m}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Loyalty() {
  return (
    <div>
      <h1 className="font-display font-bold text-brand-900 text-3xl mb-2">Loyalty Points</h1>
      <p className="text-ink-600 text-sm mb-6">Earn on every order and redeem at checkout.</p>

      <div className="sk-card p-6 md:p-8 bg-gradient-to-br from-[var(--sk-brown-900)] to-[var(--sk-brown-700)] text-white border-0">
        <div className="text-[12px] uppercase tracking-widest opacity-80">Available Balance</div>
        <div className="font-display font-bold text-5xl mt-2">1,250 pts</div>
        <div className="opacity-80 mt-1 text-sm">≈ {inr(125)} in savings</div>
        <button type="button" className="mt-5 inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          Redeem at Checkout
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mt-4">
        {[
          { Ic: TrendingUp, t: 'Earn 5 pts on ₹100', s: 'On every qualifying order' },
          { Ic: Gift, t: 'Redeem at Checkout', s: '1 pt = ₹0.10' },
          { Ic: Award, t: 'Refer & Earn 500 pts', s: 'Per successful referral' },
        ].map(({ Ic, t, s }) => (
          <div key={t} className="sk-card p-5 !shadow-sm">
            <Ic size={22} className="text-brand-900" strokeWidth={1.75} />
            <div className="font-semibold text-brand-900 mt-2.5">{t}</div>
            <div className="text-[12px] text-ink-500 mt-0.5">{s}</div>
          </div>
        ))}
      </div>

      <div className="sk-card p-5 mt-4 !shadow-sm">
        <div className="font-semibold text-brand-900 mb-3">Recent activity</div>
        <div className="space-y-2.5 text-sm">
          {[
            { d: '17 May 2025', t: 'Order #SKF12876', pts: '+125' },
            { d: '11 May 2025', t: 'Order #SKF12812', pts: '+65' },
            { d: '03 May 2025', t: 'Redeemed at checkout', pts: '−50' },
          ].map((row) => (
            <div key={row.d + row.t} className="flex items-center justify-between py-2 border-b border-line last:border-0">
              <div>
                <div className="font-medium text-brand-900">{row.t}</div>
                <div className="text-[12px] text-ink-500">{row.d}</div>
              </div>
              <span className={`font-semibold ${row.pts.startsWith('+') ? 'text-[var(--sk-green-500)]' : 'text-ink-600'}`}>
                {row.pts} pts
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Settings (mock 19) ─────────────────────────────────────── */

function PasswordField({ label, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="text-[12px] font-semibold text-ink-500">{label}</label>
      <div className="relative mt-1">
        <input
          type={show ? 'text' : 'password'}
          className="sk-input pr-10"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-brand-900"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

export function ProfileSettings() {
  const { user, name, email, phone } = useUserProfile();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [saved, setSaved] = useState(false);
  const [prefs, setPrefs] = useState({ email: true, sms: true, whatsapp: false });

  React.useEffect(() => {
    setForm({ name: name || '', email: email || '', phone: phone || '' });
  }, [name, email, phone]);

  const saveProfile = async () => {
    if (!user?.uid) return;
    await saveUserProfile(user.uid, { name: form.name, phone: form.phone });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-brand-900 text-3xl">Profile Settings</h1>
        <p className="text-ink-600 mt-1.5 text-sm">Manage your personal information and account preferences.</p>
      </div>

      <div className="grid lg:grid-cols-[1.35fr_1fr] gap-5">
        <div className="space-y-5">
          <div className="sk-card p-5 md:p-6 !shadow-sm">
            <div className="font-display font-bold text-brand-900 text-lg mb-4">Personal Information</div>
            <div className="grid md:grid-cols-2 gap-3.5">
              <div className="md:col-span-2">
                <label className="text-[12px] font-semibold text-ink-500">Full Name</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="sk-input mt-1" placeholder="Full name" />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-ink-500">Email Address</label>
                <input value={form.email} readOnly className="sk-input mt-1 bg-cream-200" placeholder="Email" />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-ink-500">Phone Number</label>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="sk-input mt-1" placeholder="Phone" />
              </div>
            </div>
            <button
              type="button"
              onClick={saveProfile}
              className="sk-btn-primary mt-5 text-sm"
            >
              Save Changes
            </button>
            {saved && <span className="ml-3 text-sm text-[var(--sk-green-500)] font-medium">Saved</span>}
          </div>

          <div className="sk-card p-5 md:p-6 !shadow-sm">
            <div className="font-display font-bold text-brand-900 text-lg mb-4">Change Password</div>
            <div className="grid gap-3.5">
              <PasswordField label="Current Password" placeholder="Current password" />
              <PasswordField label="New Password" placeholder="New password" />
              <PasswordField label="Confirm New Password" placeholder="Confirm new password" />
            </div>
            <button type="button" className="sk-btn-primary mt-5 text-sm">Update Password</button>
          </div>
        </div>

        <div className="space-y-5">
          <div id="notifications" className="sk-card p-5 md:p-6 scroll-mt-28 !shadow-sm">
            <div className="font-display font-bold text-brand-900 text-lg mb-1">Preferences</div>
            <p className="text-[12px] text-ink-500 mb-3">Choose how you hear about orders and offers.</p>
            {[
              { key: 'email', t: 'Email Notifications', s: 'Order updates and offers via email.' },
              { key: 'sms', t: 'SMS Notifications', s: 'Delivery alerts on your phone.' },
              { key: 'whatsapp', t: 'WhatsApp Notifications', s: 'Updates on WhatsApp.' },
            ].map(({ key, t, s }) => (
              <label key={key} className="flex items-start gap-3 py-3.5 border-b border-line last:border-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs[key]}
                  onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }))}
                  className="accent-[var(--sk-brown-900)] h-4 w-4 mt-0.5 shrink-0"
                />
                <span>
                  <span className="block text-brand-900 text-sm font-medium">{t}</span>
                  <span className="block text-[12px] text-ink-500 mt-0.5">{s}</span>
                </span>
              </label>
            ))}
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5 md:p-6">
            <div className="font-display font-bold text-red-600 text-lg mb-2">Delete Account</div>
            <p className="text-sm text-ink-600 leading-relaxed">
              Permanently remove your account and all associated data. This cannot be undone.
            </p>
            <button type="button" className="mt-4 inline-flex items-center justify-center rounded-xl border border-red-400 bg-white px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
