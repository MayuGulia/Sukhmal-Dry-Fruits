import React, { useState } from 'react';
import { Link, NavLink, useParams, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { PageHeader } from '@/components/shared/Breadcrumb';
import { LayoutDashboard, Package, Heart, MapPin, CreditCard, Gift, Settings, LogOut, ShoppingBag, FileText, ChevronRight, Download, Trash2, Edit3, Plus, Award, TrendingUp } from 'lucide-react';
import { inr } from '@/lib/utils';

const MOCK_ORDERS = [
  { id: 'ord_abc123', date: '14 Jan 2025', total: 1499, status: 'delivered', items: 3, image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=200&auto=format&fit=crop' },
  { id: 'ord_def456', date: '02 Jan 2025', total: 2499, status: 'shipped', items: 1, image: 'https://images.unsplash.com/photo-1608797178974-15b35a64ede9?w=200&auto=format&fit=crop' },
  { id: 'ord_ghi789', date: '20 Dec 2024', total: 799, status: 'delivered', items: 2, image: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=200&auto=format&fit=crop' },
  { id: 'ord_jkl012', date: '05 Dec 2024', total: 1299, status: 'delivered', items: 2, image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=200&auto=format&fit=crop' },
];

const STATUS_STYLE = {
  processing: 'bg-cream-300 text-brand-900',
  shipped: 'bg-[var(--sk-gold-500)] text-white',
  delivered: 'bg-[var(--sk-green-100)] text-[var(--sk-green-500)]',
  cancelled: 'bg-red-100 text-red-500',
};

const ADDRESSES = [
  { id: 'a1', label: 'Home', name: 'Priya Sharma', line1: '145, Katra Neel', line2: 'Chandni Chowk, New Delhi', pincode: '110006', phone: '+91 98765 43210' },
  { id: 'a2', label: 'Office', name: 'Priya Sharma', line1: 'DLF Cyber Hub, Level 3', line2: 'Sector 24, Gurugram', pincode: '122002', phone: '+91 98765 43210' },
];

const SIDEBAR = [
  { to: '/account', label: 'Dashboard', Ic: LayoutDashboard, end: true },
  { to: '/account/orders', label: 'My Orders', Ic: Package },
  { to: '/account/order-history', label: 'Order History', Ic: FileText },
  { to: '/wishlist', label: 'Wishlist', Ic: Heart },
  { to: '/account/addresses', label: 'Saved Addresses', Ic: MapPin },
  { to: '/account/payment-methods', label: 'Payment Methods', Ic: CreditCard },
  { to: '/account/loyalty', label: 'Loyalty Points', Ic: Gift },
  { to: '/account/settings', label: 'Profile Settings', Ic: Settings },
];

export function AccountLayout() {
  const { user, isAuthed, logout, loading } = useAuth();
  const nav = useNavigate();
  React.useEffect(() => {
    if (!loading && !isAuthed) nav('/login');
  }, [isAuthed, loading, nav]);
  if (!isAuthed) return null;

  return (
    <div>
      <PageHeader title={`Hi, ${user.displayName}`} subtitle="Manage your orders, addresses, and preferences." breadcrumb={[{ label: 'My Account' }]} />
      <div className="sk-container py-8 grid md:grid-cols-[260px_1fr] gap-6">
        <aside className="sk-card p-3 h-fit">
          {SIDEBAR.map(({ to, label, Ic, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'bg-brand-900 text-white' : 'text-brand-900 hover:bg-cream-200'}`}><Ic size={16} /> {label}</NavLink>
          ))}
          <button onClick={() => { logout(); nav('/'); }} className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50"><LogOut size={16} /> Log out</button>
        </aside>
        <div><Outlet /></div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const { ids } = useWishlist();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{ n: MOCK_ORDERS.length, l: 'Orders', Ic: Package, to: '/account/orders' }, { n: ids.length, l: 'Wishlist', Ic: Heart, to: '/wishlist' }, { n: ADDRESSES.length, l: 'Addresses', Ic: MapPin, to: '/account/addresses' }, { n: 1250, l: 'Points', Ic: Award, to: '/account/loyalty' }].map(({ n, l, Ic, to }) => (
          <Link key={l} to={to} className="sk-card p-4 hover:shadow-sk-md">
            <Ic size={22} className="text-brand-900" />
            <div className="font-display font-bold text-brand-900 text-2xl mt-2">{n}</div>
            <div className="text-[12px] text-ink-500">{l}</div>
          </Link>
        ))}
      </div>

      <div className="sk-card p-5">
        <div className="flex items-center justify-between mb-4"><div className="font-display font-bold text-brand-900 text-lg">Recent Orders</div><Link to="/account/orders" className="sk-btn-ghost text-sm">View All <ChevronRight size={14} /></Link></div>
        <div className="space-y-3">
          {MOCK_ORDERS.slice(0, 3).map((o) => (
            <Link key={o.id} to={`/account/orders/${o.id}`} className="flex items-center gap-3 border-b border-line pb-3 last:border-0">
              <img src={o.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1"><div className="font-semibold text-brand-900 text-sm font-mono">{o.id}</div><div className="text-[12px] text-ink-500">{o.date} • {o.items} items</div></div>
              <span className={`sk-pill ${STATUS_STYLE[o.status]}`}>{o.status}</span>
              <div className="font-display font-bold text-brand-900">{inr(o.total)}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {[{ to: '/track-order', l: 'Track Order', Ic: Package }, { to: '/build-hamper/budget', l: 'Build Hamper', Ic: Gift }, { to: '/contact-us', l: 'Contact Support', Ic: FileText }].map(({ to, l, Ic }) => (
          <Link key={l} to={to} className="sk-card p-4 flex items-center justify-between hover:shadow-sk-md"><span className="inline-flex items-center gap-2 font-semibold text-brand-900"><Ic size={16} /> {l}</span><ChevronRight size={14} /></Link>
        ))}
      </div>
    </div>
  );
}

export function MyOrders({ history = false }) {
  const [tab, setTab] = useState('all');
  const filtered = MOCK_ORDERS.filter((o) => tab === 'all' || o.status === tab);
  return (
    <div>
      <div className="font-display text-2xl text-brand-900 font-bold mb-4">{history ? 'Order History' : 'My Orders'}</div>
      {!history && (
        <div className="flex flex-wrap gap-2 mb-4">
          {['all','processing','shipped','delivered','cancelled'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${tab === t ? 'bg-brand-900 text-white' : 'bg-white border border-line-strong text-brand-900'}`}>{t}</button>
          ))}
        </div>
      )}
      <div className="space-y-3">
        {filtered.map((o) => (
          <Link key={o.id} to={`/account/orders/${o.id}`} className="sk-card p-4 flex items-center gap-3 hover:shadow-sk-md">
            <img src={o.image} alt="" className="w-14 h-14 rounded-lg object-cover" />
            <div className="flex-1"><div className="font-mono font-semibold text-brand-900 text-sm">{o.id}</div><div className="text-[12px] text-ink-500">{o.date} • {o.items} items</div></div>
            <span className={`sk-pill ${STATUS_STYLE[o.status]}`}>{o.status}</span>
            <div className="font-display font-bold text-brand-900 hidden md:block">{inr(o.total)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function OrderDetail() {
  const { orderId } = useParams();
  const o = MOCK_ORDERS.find((x) => x.id === orderId) || MOCK_ORDERS[0];
  return (
    <div className="space-y-4">
      <Link to="/account/orders" className="sk-btn-ghost text-sm">← Back to Orders</Link>
      <div className="sk-card p-5">
        <div className="flex items-start justify-between"><div><div className="font-display font-bold text-brand-900 text-2xl">Order {o.id}</div><div className="text-[12px] text-ink-500 mt-1">Placed on {o.date}</div></div><span className={`sk-pill ${STATUS_STYLE[o.status]}`}>{o.status}</span></div>
      </div>
      <div className="sk-card p-5"><div className="font-semibold text-brand-900 mb-2">Items ({o.items})</div><div className="flex items-center gap-3 border-b border-line pb-3 last:border-0"><img src={o.image} className="w-14 h-14 rounded-lg object-cover" alt="" /><div className="flex-1"><div className="font-semibold text-brand-900 text-sm">Royal Gold Hamper</div><div className="text-[12px] text-ink-500">1kg • Qty 1</div></div><div className="font-display font-bold text-brand-900">{inr(o.total)}</div></div></div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="sk-card p-5"><div className="font-semibold text-brand-900 mb-2">Delivery Address</div><div className="text-sm text-ink-600">Priya Sharma<br />145, Katra Neel, Chandni Chowk<br />New Delhi – 110006</div></div>
        <div className="sk-card p-5"><div className="font-semibold text-brand-900 mb-2">Order Summary</div><div className="space-y-1 text-sm"><div className="flex justify-between"><span className="text-ink-600">Subtotal</span><span>{inr(o.total)}</span></div><div className="flex justify-between"><span className="text-ink-600">GST</span><span>{inr(Math.round(o.total * 0.05))}</span></div><div className="flex justify-between"><span className="text-ink-600">Shipping</span><span>FREE</span></div><div className="flex justify-between border-t border-line pt-2 font-bold text-brand-900"><span>Total</span><span>{inr(o.total)}</span></div></div></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to="/track-order" className="sk-btn-primary text-sm">Track Order</Link>
        <button className="sk-btn-outline text-sm"><Download size={14} /> Download Invoice</button>
        <button className="sk-btn-outline text-sm">Reorder</button>
        {o.status === 'delivered' && <Link to={`/account/orders/${o.id}/return`} className="sk-btn-outline text-sm">Return / Refund</Link>}
        {o.status !== 'delivered' && <button className="sk-btn-outline text-sm text-red-500 border-red-500">Cancel Order</button>}
      </div>
    </div>
  );
}

export function ReturnOrder() {
  const [reason, setReason] = useState('damaged');
  const [notes, setNotes] = useState('');
  const [sent, setSent] = useState(false);
  if (sent) return <div className="sk-card p-10 text-center"><div className="font-display text-2xl text-brand-900">Return request submitted!</div><p className="text-ink-600 mt-2">We’ll review and respond within 24 hours.</p></div>;
  return (
    <div className="sk-card p-5">
      <div className="font-display font-bold text-brand-900 text-xl">Request Return / Cancellation</div>
      <p className="text-ink-600 text-sm mt-1">Please share a few details so we can process this quickly.</p>
      <div className="mt-4"><label className="font-semibold text-brand-900 text-sm">Reason</label>
        <select value={reason} onChange={(e) => setReason(e.target.value)} className="sk-input mt-2">{['damaged','wrong item','not fresh','changed mind','other'].map((r) => <option key={r}>{r}</option>)}</select></div>
      <div className="mt-3"><label className="font-semibold text-brand-900 text-sm">Additional notes</label><textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="sk-input mt-2" placeholder="Anything else we should know?" /></div>
      <button onClick={() => setSent(true)} className="sk-btn-primary mt-4">Submit Request</button>
    </div>
  );
}

export function Addresses() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4"><div className="font-display text-2xl text-brand-900 font-bold">Saved Addresses</div><button className="sk-btn-primary text-sm"><Plus size={14} /> Add New Address</button></div>
      <div className="grid md:grid-cols-2 gap-3">
        {ADDRESSES.map((a) => (
          <div key={a.id} className="sk-card p-5"><div className="flex items-start justify-between"><span className="sk-pill sk-pill-gold">{a.label}</span><div className="flex gap-2"><button className="text-brand-900"><Edit3 size={14} /></button><button className="text-red-500"><Trash2 size={14} /></button></div></div><div className="font-semibold text-brand-900 mt-3">{a.name}</div><div className="text-sm text-ink-600">{a.line1}, {a.line2}</div><div className="text-sm text-ink-600">Pincode: {a.pincode}</div><div className="text-[12px] text-ink-500 mt-1">{a.phone}</div></div>
        ))}
      </div>
    </div>
  );
}

export function PaymentMethods() {
  return (
    <div>
      <div className="font-display text-2xl text-brand-900 font-bold mb-4">Payment Methods</div>
      <div className="sk-card p-6"><div className="text-ink-600">You haven’t saved any payment methods yet. Cards are securely stored by our payment partner (Razorpay). You can add a card during checkout.</div></div>
    </div>
  );
}

export function Loyalty() {
  return (
    <div>
      <div className="font-display text-2xl text-brand-900 font-bold mb-4">Loyalty Points</div>
      <div className="sk-card p-6 bg-gradient-to-br from-brand-900 to-brand-700 text-white"><div className="text-[12px] uppercase tracking-widest opacity-80">Available Balance</div><div className="font-display font-bold text-5xl mt-2">1,250 pts</div><div className="opacity-80 mt-1">≈ {inr(125)} in savings</div></div>
      <div className="grid md:grid-cols-3 gap-3 mt-4">
        {[{ Ic: TrendingUp, t: 'Earn 5 pts on ₹100', s: 'On every order' }, { Ic: Gift, t: 'Redeem at Checkout', s: '1 pt = ₹0.10' }, { Ic: Award, t: 'Refer & Earn 500 pts', s: 'Per successful referral' }].map(({ Ic, t, s }) => (
          <div key={t} className="sk-card p-4"><Ic size={22} className="text-brand-900" /><div className="font-semibold text-brand-900 mt-2">{t}</div><div className="text-[12px] text-ink-500">{s}</div></div>
        ))}
      </div>
    </div>
  );
}

export function ProfileSettings() {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <div className="sk-card p-5">
        <div className="font-display font-bold text-brand-900 text-lg mb-3">Personal Information</div>
        <div className="grid md:grid-cols-2 gap-3">
          <input defaultValue={user?.displayName} className="sk-input" placeholder="Full name" />
          <input defaultValue={user?.email} className="sk-input" placeholder="Email" />
          <input defaultValue={user?.phone || '+91 98765 43210'} className="sk-input" placeholder="Phone" />
          <input type="date" className="sk-input" />
        </div>
        <button className="sk-btn-primary mt-4 text-sm">Save Changes</button>
      </div>
      <div className="sk-card p-5">
        <div className="font-display font-bold text-brand-900 text-lg mb-3">Change Password</div>
        <div className="grid md:grid-cols-2 gap-3"><input type="password" className="sk-input" placeholder="Current password" /><input type="password" className="sk-input" placeholder="New password" /></div>
        <button className="sk-btn-primary mt-4 text-sm">Update Password</button>
      </div>
      <div className="sk-card p-5">
        <div className="font-display font-bold text-brand-900 text-lg mb-3">Notification Preferences</div>
        {['Email','SMS','WhatsApp'].map((c) => (
          <label key={c} className="flex items-center justify-between py-2"><span className="text-brand-900">{c} notifications</span><input type="checkbox" defaultChecked className="accent-[var(--sk-brown-900)]" /></label>
        ))}
      </div>
      <div className="sk-card p-5 border-red-200"><div className="font-display font-bold text-red-500 text-lg mb-2">Danger Zone</div><p className="text-sm text-ink-600">Deleting your account is permanent and cannot be undone.</p><button className="sk-btn-outline mt-3 text-red-500 border-red-500 text-sm">Delete Account</button></div>
    </div>
  );
}
