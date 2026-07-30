import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/shared/Breadcrumb';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { inr } from '@/lib/utils';
import { Lock, MapPin, CalendarDays, Gift, CreditCard, Landmark, Wallet, Banknote, ChevronDown, Shield } from 'lucide-react';
import { api } from '@/lib/api';

const PAY_METHODS = [
  { key: 'upi', label: 'UPI', Ic: Wallet, desc: 'Google Pay, PhonePe, Paytm, BHIM' },
  { key: 'card', label: 'Credit / Debit Card', Ic: CreditCard, desc: 'Visa, Mastercard, RuPay, Amex' },
  { key: 'nb', label: 'Net Banking', Ic: Landmark, desc: 'All major banks' },
  { key: 'wallet', label: 'Wallets', Ic: Wallet, desc: 'Paytm, Amazon Pay, MobiKwik' },
  { key: 'cod', label: 'Cash on Delivery', Ic: Banknote, desc: 'Available in select pincodes' },
];

const ADDRESSES = [
  { id: 'a1', label: 'Home', name: 'Priya Sharma', line1: '145, Katra Neel', line2: 'Chandni Chowk, New Delhi', pincode: '110006', phone: '+91 98765 43210' },
  { id: 'a2', label: 'Office', name: 'Priya Sharma', line1: 'DLF Cyber Hub, Level 3', line2: 'Sector 24, Gurugram', pincode: '122002', phone: '+91 98765 43210' },
];

export default function Checkout() {
  const { items, totals, clear } = useCart();
  const { isAuthed, login } = useAuth();
  const nav = useNavigate();
  const [address, setAddress] = useState(ADDRESSES[0].id);
  const [showSummary, setShowSummary] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('tomorrow');
  const [payment, setPayment] = useState('upi');
  const [placing, setPlacing] = useState(false);
  const [giftMsg, setGiftMsg] = useState({ on: false, name: '', phone: '', text: '' });

  if (items.length === 0) return (
    <div className="sk-container py-24 text-center">
      <div className="font-display text-2xl text-brand-900">Your cart is empty.</div>
      <Link to="/category/all" className="sk-btn-primary mt-4 inline-flex">Continue Shopping</Link>
    </div>
  );

  // Auto-login as a demo customer if not signed in (Phase 3 will swap this)
  const ensureAuth = () => { if (!isAuthed) login({ email: 'demo@sukhmal.in', name: 'Demo User' }); };

  const placeOrder = async () => {
    ensureAuth();
    setPlacing(true);
    try {
      // Real integration: POST /api/orders with idempotency key, get Razorpay order_id, open checkout.
      // For now, we simulate the payment core flow (POC-shaped): create order, simulate webhook to confirm.
      const idempotency_key = 'chk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      // Show a Razorpay-style loading modal for 900ms
      await new Promise((r) => setTimeout(r, 900));
      const orderId = 'ord_' + Math.random().toString(36).slice(2, 12);
      // Success path (webhook-confirmed in production; simulated here)
      clear();
      nav(`/order-success/${orderId}`);
    } finally { setPlacing(false); }
  };

  return (
    <div>
      <PageHeader title="Checkout" breadcrumb={[{ label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />
      {/* Step indicator */}
      <div className="sk-container pt-6">
        <div className="flex items-center gap-3 text-sm">
          {[['Cart', true], ['Checkout', true], ['Payment', false], ['Confirmation', false]].map(([l, active], i) => (
            <React.Fragment key={l}>
              <div className={`inline-flex items-center gap-2 ${active ? 'text-brand-900' : 'text-ink-500'}`}>
                <div className={`w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold ${active ? 'bg-brand-900 text-white' : 'bg-line-strong text-white'}`}>{i + 1}</div>
                <span className="font-semibold">{l}</span>
              </div>
              {i < 3 && <div className={`flex-1 h-[2px] max-w-[40px] ${active ? 'bg-brand-900' : 'bg-line-strong'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="sk-container py-8 grid md:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-6">
          {/* Address */}
          <section className="sk-card p-5">
            <div className="flex items-center justify-between">
              <div className="font-display text-lg font-bold text-brand-900 inline-flex items-center gap-2"><MapPin size={18} /> Delivery Address</div>
              <button className="sk-btn-ghost text-sm">+ Add New Address</button>
            </div>
            <div className="mt-4 grid md:grid-cols-2 gap-3">
              {ADDRESSES.map((a) => (
                <label key={a.id} className={`sk-card p-4 cursor-pointer flex gap-3 ${address === a.id ? 'ring-2 ring-brand-900' : ''}`}>
                  <input type="radio" name="addr" checked={address === a.id} onChange={() => setAddress(a.id)} className="mt-1 accent-[var(--sk-brown-900)]" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><b className="text-brand-900">{a.name}</b><span className="sk-pill">{a.label}</span></div>
                    <div className="text-sm text-ink-600 mt-1">{a.line1}, {a.line2} – {a.pincode}</div>
                    <div className="text-[12px] text-ink-500 mt-0.5">{a.phone}</div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Delivery date */}
          <section className="sk-card p-5">
            <div className="font-display text-lg font-bold text-brand-900 inline-flex items-center gap-2"><CalendarDays size={18} /> Delivery Date</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[{ k: 'today', l: 'Today' }, { k: 'tomorrow', l: 'Tomorrow' }, { k: 'custom', l: 'Custom' }].map((o) => (
                <button key={o.k} onClick={() => setDeliveryDate(o.k)} className={`px-4 py-2 rounded-full text-sm font-medium ${deliveryDate === o.k ? 'bg-brand-900 text-white' : 'bg-white text-brand-900 border border-line-strong'}`}>{o.l}</button>
              ))}
              {deliveryDate === 'custom' && <input type="date" min={new Date().toISOString().split('T')[0]} className="sk-input !py-2 max-w-[200px]" />}
            </div>
          </section>

          {/* Gift message */}
          <section className="sk-card p-5">
            <label className="font-display text-lg font-bold text-brand-900 inline-flex items-center gap-2"><Gift size={18} /> Send as Gift?</label>
            <div className="mt-2 flex items-center gap-2">
              <input type="checkbox" checked={giftMsg.on} onChange={(e) => setGiftMsg({ ...giftMsg, on: e.target.checked })} className="accent-[var(--sk-brown-900)]" /> <span className="text-sm text-ink-600">Add recipient details and gift message</span>
            </div>
            {giftMsg.on && (
              <div className="mt-3 grid md:grid-cols-2 gap-3">
                <input value={giftMsg.name} onChange={(e) => setGiftMsg({ ...giftMsg, name: e.target.value })} placeholder="Recipient name" className="sk-input" />
                <input value={giftMsg.phone} onChange={(e) => setGiftMsg({ ...giftMsg, phone: e.target.value })} placeholder="Recipient phone" className="sk-input" />
                <textarea value={giftMsg.text} onChange={(e) => setGiftMsg({ ...giftMsg, text: e.target.value.slice(0, 150) })} rows={2} placeholder="Gift message (150 chars)" className="sk-input md:col-span-2" />
                <div className="md:col-span-2 text-[11px] text-ink-500 text-right">{giftMsg.text.length}/150</div>
              </div>
            )}
          </section>

          {/* Payment methods */}
          <section className="sk-card p-5">
            <div className="font-display text-lg font-bold text-brand-900 inline-flex items-center gap-2"><Shield size={18} /> Payment Method</div>
            <div className="mt-4 space-y-2">
              {PAY_METHODS.map((m) => (
                <label key={m.key} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${payment === m.key ? 'border-brand-900 bg-cream-200' : 'border-line hover:border-line-strong'}`}>
                  <input type="radio" name="pay" checked={payment === m.key} onChange={() => setPayment(m.key)} className="accent-[var(--sk-brown-900)]" />
                  <m.Ic size={20} className="text-brand-900" />
                  <div className="flex-1">
                    <div className="font-semibold text-brand-900 text-sm">{m.label}</div>
                    <div className="text-[11px] text-ink-500">{m.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Sticky sidebar (desktop) / collapsible bar (mobile) */}
        <aside className="hidden md:block sk-card p-5 h-fit sticky top-4">
          <div className="font-display font-bold text-brand-900 text-lg">Order Summary</div>
          <div className="mt-3 space-y-1.5 text-sm max-h-[240px] overflow-auto pr-2">
            {items.map((it) => (
              <div key={it.key} className="flex items-center gap-2">
                <img src={it.image} className="w-10 h-10 rounded-lg object-cover bg-cream-200" alt="" />
                <div className="flex-1">
                  <div className="line-clamp-1 text-brand-900">{it.name}</div>
                  <div className="text-[11px] text-ink-500">Qty {it.qty}{it.variant ? ` • ${it.variant}` : ''}</div>
                </div>
                <div className="font-semibold text-brand-900 text-[13px]">{inr(it.price * it.qty)}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 border-t border-line pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-ink-600">Subtotal</span><span>{inr(totals.subtotal)}</span></div>
            {totals.discount > 0 && <div className="flex justify-between text-[var(--sk-green-500)]"><span>Discount</span><span>–{inr(totals.discount)}</span></div>}
            <div className="flex justify-between"><span className="text-ink-600">GST</span><span>{inr(totals.gst)}</span></div>
            <div className="flex justify-between"><span className="text-ink-600">Shipping</span><span>{totals.shipping === 0 ? 'FREE' : inr(totals.shipping)}</span></div>
            <div className="flex justify-between border-t border-line pt-2 mt-2"><span className="font-display">Total</span><span className="font-display font-bold text-lg">{inr(totals.total)}</span></div>
          </div>
          <button onClick={placeOrder} disabled={placing} data-testid="place-order" className="sk-btn-primary w-full mt-5 !py-3.5">
            {placing ? 'Processing...' : <><Lock size={16} /> Place Order Securely</>}
          </button>
          <div className="mt-3 text-[11px] text-ink-500 text-center">SSL secured • 100% safe payments</div>
        </aside>

        {/* Mobile collapsible summary + place button */}
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-30 bg-white border-t border-line shadow-sk-lg">
          <button onClick={() => setShowSummary((s) => !s)} className="w-full flex items-center justify-between px-4 py-3">
            <div><div className="text-[11px] text-ink-500">Total</div><div className="font-display font-bold text-brand-900 text-lg">{inr(totals.total)}</div></div>
            <div className="sk-btn-ghost text-sm"><ChevronDown size={16} className={showSummary ? 'rotate-180 transition' : 'transition'} /> {items.length} item{items.length !== 1 ? 's' : ''}</div>
          </button>
          {showSummary && (
            <div className="px-4 pb-3 space-y-1.5 text-sm border-t border-line pt-2">
              <div className="flex justify-between"><span className="text-ink-600">Subtotal</span><span>{inr(totals.subtotal)}</span></div>
              {totals.discount > 0 && <div className="flex justify-between text-[var(--sk-green-500)]"><span>Discount</span><span>–{inr(totals.discount)}</span></div>}
              <div className="flex justify-between"><span className="text-ink-600">GST</span><span>{inr(totals.gst)}</span></div>
              <div className="flex justify-between"><span className="text-ink-600">Shipping</span><span>{totals.shipping === 0 ? 'FREE' : inr(totals.shipping)}</span></div>
            </div>
          )}
          <button onClick={placeOrder} disabled={placing} className="sk-btn-primary w-full !rounded-none !py-4 text-base">{placing ? 'Processing...' : <><Lock size={16} /> Place Order Securely</>}</button>
        </div>
      </div>
    </div>
  );
}
