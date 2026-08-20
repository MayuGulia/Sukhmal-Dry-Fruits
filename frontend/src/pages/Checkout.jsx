import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { TrustStrip } from '@/components/shared/ProductCard';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { inr } from '@/lib/utils';
import { attachRazorpayOrderId, createCustomerOrder, saveUserAddresses } from '@/lib/orders';
import { useUserProfile } from '@/hooks/useAccountData';
import { api } from '@/lib/api';
import {
  Lock, MapPin, CalendarDays, Gift, CreditCard, Landmark, Wallet, Banknote,
  ChevronDown, ChevronLeft, ChevronRight, ShieldCheck, Plus, Truck,
} from 'lucide-react';

const PAY_METHODS = [
  { key: 'upi', label: 'UPI', Ic: Wallet, desc: 'Pay with UPI Apps' },
  { key: 'card', label: 'Credit / Debit Card', Ic: CreditCard, desc: 'Visa · MasterCard · RuPay' },
  { key: 'nb', label: 'Net Banking', Ic: Landmark, desc: 'All Major Banks' },
  { key: 'wallet', label: 'Wallets', Ic: Wallet, desc: 'Paytm · PhonePe · Amazon Pay' },
  { key: 'cod', label: 'Cash on Delivery', Ic: Banknote, desc: 'Pay when you receive' },
];

const STEPS = [
  { label: 'Cart', to: '/cart' },
  { label: 'Checkout', current: true },
  { label: 'Payment' },
  { label: 'Order Confirmation' },
];

function formatDayLabel(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function minDateStr() {
  return new Date().toISOString().split('T')[0];
}

function FlourishGold() {
  return (
    <div className="mx-auto mt-1.5 flex items-center justify-center gap-2 text-[var(--sk-gold-400)]" aria-hidden>
      <span className="text-[10px] leading-none">❧</span>
      <span className="h-px w-10 bg-[var(--sk-gold-400)]/70" />
      <span className="text-[10px] leading-none">❧</span>
    </div>
  );
}

function OrderSummaryBody({ items, totals, count }) {
  return (
    <>
      <div className="space-y-0 text-sm max-h-[240px] overflow-auto">
        {items.map((it, idx) => (
          <div
            key={it.key}
            className={`flex items-start gap-2.5 py-3 ${idx > 0 ? 'border-t border-line' : ''}`}
          >
            <img src={it.image} className="w-12 h-12 rounded-lg object-cover bg-cream-200 border border-line shrink-0" alt="" />
            <div className="flex-1 min-w-0">
              <div className="line-clamp-1 font-display font-semibold text-brand-900 text-[13px]">{it.name}</div>
              {it.variant && <div className="text-[11px] text-ink-500 mt-0.5">{it.variant}</div>}
              <div className="text-[11px] text-ink-600 mt-0.5">{inr(it.price)} x {it.qty}</div>
            </div>
            <div className="font-display font-semibold text-brand-900 text-[13px] shrink-0">{inr(it.price * it.qty)}</div>
          </div>
        ))}
      </div>

      <div className="mt-1 border-t border-line pt-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-ink-600">Subtotal ({count} Item{count !== 1 ? 's' : ''})</span>
          <span className="text-brand-900">{inr(totals.subtotal)}</span>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between text-[var(--sk-green-500)]">
            <span>Discount</span>
            <span>– {inr(totals.discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-ink-600">GST (5%)</span>
          <span className="text-brand-900">{inr(totals.gst)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-600">Shipping Charges</span>
          <span className={totals.shipping === 0 ? 'text-[var(--sk-green-500)] font-bold' : 'text-brand-900'}>
            {totals.shipping === 0 ? 'FREE' : inr(totals.shipping)}
          </span>
        </div>

        <div className="mt-3 rounded-lg bg-cream-300/80 px-3.5 py-3 flex justify-between items-end gap-2">
          <div>
            <div className="font-semibold text-brand-900">Total Amount</div>
            <div className="text-[10px] text-ink-500">(Inclusive of all taxes)</div>
          </div>
          <span className="font-display font-bold text-xl text-brand-900">{inr(totals.total)}</span>
        </div>
      </div>

      {totals.discount > 0 && (
        <div className="mt-3 text-[12px] text-[var(--sk-green-500)] bg-[var(--sk-green-100)] p-3 rounded-lg flex items-center gap-2">
          <Truck size={14} className="shrink-0" />
          Yay! You are saving {inr(totals.discount)} on this order.
        </div>
      )}
    </>
  );
}

export default function Checkout() {
  const { items, totals, clear, count, coupon } = useCart();
  const { isAuthed, loading: authLoading, user, refreshSession } = useAuth();
  const { addresses } = useUserProfile();
  const nav = useNavigate();
  const loc = useLocation();
  const [address, setAddress] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('custom');
  const [customDate, setCustomDate] = useState('');
  const [payment, setPayment] = useState('upi');
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState('');
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [giftMsg, setGiftMsg] = useState({ name: '', phone: '', text: '' });
  const [newAddr, setNewAddr] = useState({ name: '', phone: '', line1: '', line2: '', pincode: '' });

  useEffect(() => {
    if (!address && addresses[0]?.id) setAddress(addresses[0].id);
  }, [addresses, address]);

  // Guests must log in — never silent auto-login
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthed) {
      const returnPath = loc.pathname + loc.search;
      nav(`/login?return=${encodeURIComponent(returnPath)}`, {
        replace: true,
        state: { from: returnPath, returnTo: returnPath },
      });
    }
  }, [isAuthed, authLoading, nav, loc.pathname, loc.search]);

  if (authLoading || !isAuthed) {
    return (
      <div className="sk-container py-24 text-center text-ink-500 text-sm">
        Redirecting to login…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="sk-container py-24 text-center">
        <div className="font-display text-2xl text-brand-900">Your cart is empty.</div>
        <Link to="/category/all" className="sk-btn-primary mt-4 inline-flex">Continue Shopping</Link>
      </div>
    );
  }

  const selectedAddr = addresses.find((a) => a.id === address) || addresses[0] || null;

  const saveNewAddress = async () => {
    if (!user?.uid || !newAddr.name.trim() || !newAddr.line1.trim() || !newAddr.pincode.trim()) return;
    const next = {
      id: `a_${Date.now()}`,
      label: 'Home',
      ...newAddr,
      isDefault: addresses.length === 0,
    };
    await saveUserAddresses(user.uid, [...addresses, next]);
    setAddress(next.id);
    setShowAddAddr(false);
    setNewAddr({ name: '', phone: '', line1: '', line2: '', pincode: '' });
  };

  const placeOrder = async () => {
    if (!selectedAddr) {
      setPlaceError('Please add a delivery address.');
      setShowAddAddr(true);
      return;
    }
    if (user?.email) {
      let session = user;
      try { session = await refreshSession?.() || user; } catch {}
      if (!session?.emailVerified) {
        setPlaceError('Please verify your email before placing an order. Check your inbox for the verification link.');
        return;
      }
    }
    setPlacing(true);
    setPlaceError('');
    try {
      const method = payment === 'cod' ? 'cod' : 'razorpay';
      const created = await createCustomerOrder({
        user,
        items,
        address: selectedAddr,
        totals,
        paymentMethod: method,
        giftMsg,
        deliveryDate,
        customDate,
        coupon: coupon?.code || null,
      });
      const orderId = created.orderId;

      if (method === 'cod') {
        try {
          const notify = await api.post('/create-order', {
            orderId,
            paymentMethod: 'cod',
            order: {
              orderId,
              customer: created.customer,
              shippingAddress: created.shippingAddress,
              items: created.items,
              totals: created.totals,
              total: created.total,
              paymentMethod: 'cod',
              eta: created.eta,
            },
          });
          if (!notify.data?.ownerNotified) {
            console.error('COD owner notify did not confirm', notify.data);
          }
        } catch (err) {
          console.error('COD owner notify request failed', err);
        }
      }

      if (method === 'razorpay') {
        try {
          const r = await api.post('/create-order', {
            orderId,
            amount: totals.total,
            total: totals.total,
            paymentMethod: 'razorpay',
            items: items.map((it) => ({ id: it.id, slug: it.slug, qty: it.qty, variant: it.variant })),
          });
          if (r.data?.razorpayOrderId && window.Razorpay && (r.data.keyId || process.env.REACT_APP_RAZORPAY_KEY_ID)) {
            await attachRazorpayOrderId(orderId, r.data.razorpayOrderId);
            await new Promise((resolve, reject) => {
              const rzp = new window.Razorpay({
                key: r.data.keyId || process.env.REACT_APP_RAZORPAY_KEY_ID,
                amount: r.data.amount,
                currency: r.data.currency || 'INR',
                order_id: r.data.razorpayOrderId,
                handler: async (resp) => {
                  try {
                    await api.post('/verify-payment', { ...resp, orderId });
                    resolve();
                  } catch (e) { reject(e); }
                },
                modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
              });
              rzp.open();
            });
          }
        } catch (err) {
          if (err?.message === 'Payment cancelled') throw err;
        }
      }

      const snap = {
        orderId,
        placedAt: new Date().toISOString(),
        paymentMethod: payment,
        paymentLabel: PAY_METHODS.find((m) => m.key === payment)?.label || payment,
        address: selectedAddr,
        deliveryDate,
        customDate,
        giftMsg,
        items: items.map((it) => ({
          key: it.key,
          id: it.id,
          name: it.name,
          image: it.image,
          price: it.price,
          qty: it.qty,
          variant: it.variant,
        })),
        totals: { ...totals },
        count,
        coupon: coupon?.code || null,
        eta: created.eta,
      };
      try {
        sessionStorage.setItem('sk_last_order', JSON.stringify(snap));
      } catch {}

      clear();
      nav(`/order-success/${orderId}`);
    } catch (err) {
      setPlaceError(err?.message || 'Could not place the order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="pb-28 md:pb-0">
      {user?.email && !user.emailVerified && (
        <div className="bg-[var(--sk-gold-100)] border-b border-[var(--sk-gold-300)] text-brand-900 text-sm px-4 py-3 text-center">
          Please verify your email before placing an order. Check your inbox for the verification link.
        </div>
      )}
      <div className="bg-cream-100 border-b border-line">
        <div className="sk-container py-6 md:py-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display font-bold text-brand-900 text-3xl md:text-4xl">Checkout</h1>
              {/* Step indicator — Cart > Checkout > Payment > Order Confirmation */}
              <nav className="mt-3 flex items-center gap-1.5 text-sm flex-wrap" aria-label="Checkout progress">
                {STEPS.map((s, i) => (
                  <React.Fragment key={s.label}>
                    {s.to ? (
                      <Link
                        to={s.to}
                        className={`whitespace-nowrap ${s.current ? 'text-brand-900 font-semibold' : 'text-ink-500 hover:text-brand-900'}`}
                      >
                        {s.label}
                      </Link>
                    ) : (
                      <span className={`whitespace-nowrap ${s.current ? 'text-brand-900 font-semibold' : 'text-ink-500'}`}>
                        {s.label}
                      </span>
                    )}
                    {i < STEPS.length - 1 && <ChevronRight size={14} className="text-ink-400 shrink-0" />}
                  </React.Fragment>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[var(--sk-cream-400)] bg-[var(--sk-cream-300)]/90 px-3 py-2">
              <ShieldCheck size={16} className="text-brand-900 shrink-0" />
              <span className="text-[12px] font-semibold text-brand-900">Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>

      <div className="sk-container py-8 grid lg:grid-cols-[1fr_360px] gap-8 items-start">
        <div className="space-y-5">
          {/* Step 1 — Address */}
          <section className="sk-card p-5 md:p-6">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="font-display text-lg font-bold text-brand-900 inline-flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-brand-900 text-white text-[12px] grid place-items-center font-ui">1</span>
                  <MapPin size={18} /> Delivery Address
                </div>
                <p className="text-[12px] text-ink-500 mt-1 ml-9">Select or add a delivery address.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAddr((v) => !v)}
                className="text-sm font-semibold text-brand-900 inline-flex items-center gap-1 hover:underline"
                data-testid="checkout-add-address"
              >
                <Plus size={14} /> Add New Address
              </button>
            </div>

            <div className="mt-4 grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {addresses.map((a) => (
                <label
                  key={a.id}
                  className={`rounded-xl border p-3.5 cursor-pointer flex gap-2.5 transition bg-white min-h-[132px] ${
                    address === a.id
                      ? 'border-[var(--sk-gold-500)] ring-1 ring-[var(--sk-gold-500)]/50 shadow-sk-sm'
                      : 'border-line hover:border-line-strong'
                  }`}
                >
                  <input
                    type="radio"
                    name="addr"
                    checked={address === a.id}
                    onChange={() => setAddress(a.id)}
                    className="mt-1 accent-[var(--sk-brown-900)] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <b className="text-brand-900 text-sm">{a.name}</b>
                      <span className="sk-pill !bg-[var(--sk-cream-300)] !text-brand-900 !py-0.5 !px-2 text-[10px]">{a.label}</span>
                    </div>
                    <div className="text-[12px] text-ink-600 mt-1 leading-snug">
                      {a.line1}, {a.line2} – {a.pincode}
                    </div>
                    <div className="text-[11px] text-ink-500 mt-1">{a.phone}</div>
                  </div>
                </label>
              ))}

              <button
                type="button"
                onClick={() => setShowAddAddr(true)}
                className="rounded-xl border border-dashed border-line-strong p-4 min-h-[132px] flex flex-col items-center justify-center gap-2 text-brand-900 hover:bg-cream-200 transition"
              >
                <div className="w-9 h-9 rounded-full bg-cream-300 grid place-items-center">
                  <Plus size={18} />
                </div>
                <span className="font-semibold text-sm">Add New Address</span>
              </button>
            </div>

            {addresses.length === 0 && !showAddAddr && (
              <p className="mt-3 text-sm text-ink-500">No saved addresses yet. Add one to continue.</p>
            )}

            {showAddAddr && (
              <div className="mt-4 grid sm:grid-cols-2 gap-3 p-4 rounded-xl bg-cream-200 border border-line">
                <input placeholder="Full name" className="sk-input" value={newAddr.name} onChange={(e) => setNewAddr((a) => ({ ...a, name: e.target.value }))} />
                <input placeholder="Phone" className="sk-input" value={newAddr.phone} onChange={(e) => setNewAddr((a) => ({ ...a, phone: e.target.value }))} />
                <input placeholder="Address line 1" className="sk-input sm:col-span-2" value={newAddr.line1} onChange={(e) => setNewAddr((a) => ({ ...a, line1: e.target.value }))} />
                <input placeholder="City / line 2" className="sk-input" value={newAddr.line2} onChange={(e) => setNewAddr((a) => ({ ...a, line2: e.target.value }))} />
                <input placeholder="Pincode" className="sk-input" value={newAddr.pincode} onChange={(e) => setNewAddr((a) => ({ ...a, pincode: e.target.value }))} />
                <button type="button" className="sk-btn-primary sm:col-span-2 w-max" onClick={saveNewAddress}>
                  Save Address
                </button>
              </div>
            )}
            {placeError && <p className="mt-3 text-sm text-red-600">{placeError}</p>}
          </section>

          {/* Step 2 — Delivery date */}
          <section className="sk-card p-5 md:p-6">
            <div className="font-display text-lg font-bold text-brand-900 inline-flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-brand-900 text-white text-[12px] grid place-items-center font-ui">2</span>
              <CalendarDays size={18} /> Delivery Date
            </div>
            <p className="text-[12px] text-ink-500 mt-1 ml-9">Choose your preferred delivery date.</p>
            <div className="mt-4 flex flex-wrap gap-2.5 items-center">
              {[
                { k: 'today', l: `Today ${formatDayLabel(0)}` },
                { k: 'tomorrow', l: `Tomorrow ${formatDayLabel(1)}` },
                { k: 'custom', l: 'Custom Date' },
              ].map((o) => (
                <button
                  key={o.k}
                  type="button"
                  onClick={() => setDeliveryDate(o.k)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition ${
                    deliveryDate === o.k
                      ? 'bg-[var(--sk-cream-300)] text-brand-900 border-[var(--sk-gold-500)] ring-1 ring-[var(--sk-gold-500)]/40'
                      : 'bg-white text-brand-900 border-line-strong hover:border-brand-900'
                  }`}
                >
                  {o.l}
                </button>
              ))}
              {deliveryDate === 'custom' && (
                <input
                  type="date"
                  min={minDateStr()}
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="sk-input !py-2.5 !w-auto min-w-[160px]"
                />
              )}
            </div>
          </section>

          {/* Step 3 — Gift recipient */}
          <section className="sk-card p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-display text-lg font-bold text-brand-900 inline-flex items-center gap-2 flex-wrap">
                  <span className="w-7 h-7 rounded-full bg-brand-900 text-white text-[12px] grid place-items-center font-ui">3</span>
                  <Gift size={18} /> Gift Recipient Details
                  <span className="text-[12px] font-ui font-normal text-ink-500">(Optional)</span>
                </div>
                <p className="text-[12px] text-ink-500 mt-1 ml-9">For send-as-gift orders</p>
              </div>
              <div className="hidden sm:grid place-items-center w-16 h-16 rounded-xl bg-cream-300 text-[var(--sk-gold-500)] shrink-0">
                <Gift size={28} strokeWidth={1.25} />
              </div>
            </div>
            <div className="mt-4 grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-semibold text-brand-900">Recipient Name</label>
                <input
                  value={giftMsg.name}
                  onChange={(e) => setGiftMsg({ ...giftMsg, name: e.target.value })}
                  placeholder="Enter recipient name"
                  className="sk-input mt-1"
                  data-testid="gift-name"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-brand-900">Recipient Mobile</label>
                <div className="mt-1 flex gap-2">
                  <span className="sk-input !w-auto shrink-0 flex items-center text-ink-600 !px-3">+91</span>
                  <input
                    value={giftMsg.phone}
                    onChange={(e) => setGiftMsg({ ...giftMsg, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="Enter mobile number"
                    className="sk-input"
                    data-testid="gift-phone"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-[12px] font-semibold text-brand-900">Gift Message</label>
                <textarea
                  value={giftMsg.text}
                  onChange={(e) => setGiftMsg({ ...giftMsg, text: e.target.value.slice(0, 200) })}
                  rows={3}
                  placeholder="Write your message here..."
                  className="sk-input mt-1"
                  data-testid="gift-message"
                />
                <div className="text-[11px] text-ink-500 text-right mt-1">{giftMsg.text.length}/200</div>
              </div>
            </div>
          </section>

          {/* Step 4 — Payment method cards */}
          <section className="sk-card p-5 md:p-6">
            <div className="font-display text-lg font-bold text-brand-900 inline-flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-brand-900 text-white text-[12px] grid place-items-center font-ui">4</span>
              <CreditCard size={18} /> Payment Method
            </div>
            <p className="text-[12px] text-ink-500 mt-1 ml-9">Select a payment option.</p>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5">
              {PAY_METHODS.map((m) => {
                const selected = payment === m.key;
                return (
                  <label
                    key={m.key}
                    className={`relative flex flex-col gap-2 p-3.5 rounded-xl border cursor-pointer transition bg-white min-h-[110px] ${
                      selected
                        ? 'border-[var(--sk-gold-500)] ring-1 ring-[var(--sk-gold-500)]/50 bg-cream-200/40'
                        : 'border-line hover:border-line-strong'
                    }`}
                    data-testid={`pay-${m.key}`}
                  >
                    <input
                      type="radio"
                      name="pay"
                      checked={selected}
                      onChange={() => setPayment(m.key)}
                      className="absolute top-3 left-3 accent-[var(--sk-brown-900)]"
                    />
                    <m.Ic size={22} className="text-brand-900 mt-5" />
                    <div>
                      <div className="font-semibold text-brand-900 text-[13px] leading-snug">{m.label}</div>
                      <div className="text-[10px] text-ink-500 mt-0.5 leading-snug">{m.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>

          <Link to="/cart" className="sk-btn-ghost text-sm inline-flex">
            <ChevronLeft size={14} /> Back to Cart
          </Link>
        </div>

        {/* Desktop sticky summary */}
        <aside className="hidden lg:block space-y-3 sticky top-24">
          <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 shadow-sk-sm">
            <ShieldCheck size={16} className="text-[var(--sk-gold-500)] shrink-0" />
            <div className="text-[11px] text-brand-900 leading-snug">
              <span className="font-semibold">Secure Checkout</span>
              <span className="text-ink-500"> — 100% Safe &amp; Secure Payments</span>
            </div>
          </div>

          <div className="sk-card !overflow-hidden">
            <div className="bg-brand-900 text-white px-5 py-4 text-center">
              <div className="font-display font-bold text-lg">Order Summary</div>
              <FlourishGold />
            </div>
            <div className="p-5 bg-gradient-to-b from-cream-100 to-white">
              <OrderSummaryBody items={items} totals={totals} count={count} />
              <button
                type="button"
                onClick={placeOrder}
                disabled={placing}
                data-testid="place-order"
                className="sk-btn-primary w-full mt-5 !py-3.5 flex-col !gap-0.5"
              >
                {placing ? (
                  'Processing…'
                ) : (
                  <>
                    <span className="inline-flex items-center gap-2"><Lock size={16} /> Place Order Securely</span>
                    <span className="text-[10px] font-medium opacity-80">100% Safe &amp; Secure Payments</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile collapsible summary above Place Order */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-30 bg-white border-t border-line shadow-sk-lg">
        <button
          type="button"
          onClick={() => setShowSummary((s) => !s)}
          className="w-full flex items-center justify-between px-4 py-3"
          data-testid="mobile-summary-toggle"
        >
          <div>
            <div className="text-[11px] text-ink-500">Total Amount</div>
            <div className="font-display font-bold text-brand-900 text-lg">{inr(totals.total)}</div>
          </div>
          <div className="sk-btn-ghost text-sm inline-flex items-center gap-1">
            <ChevronDown size={16} className={`transition ${showSummary ? 'rotate-180' : ''}`} />
            {count} item{count !== 1 ? 's' : ''}
          </div>
        </button>
        {showSummary && (
          <div className="px-4 pb-3 border-t border-line pt-3 max-h-[40vh] overflow-auto">
            <OrderSummaryBody items={items} totals={totals} count={count} />
          </div>
        )}
        <button
          type="button"
          onClick={placeOrder}
          disabled={placing}
          data-testid="place-order-mobile"
          className="sk-btn-primary w-full !rounded-none !py-4 text-base"
        >
          {placing ? 'Processing…' : (
            <span className="inline-flex items-center gap-2"><Lock size={16} /> Place Order Securely</span>
          )}
        </button>
      </div>

      <TrustStrip />
    </div>
  );
}
