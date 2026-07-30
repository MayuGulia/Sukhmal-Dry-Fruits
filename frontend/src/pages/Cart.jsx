import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/Breadcrumb';
import { useCart } from '@/contexts/CartContext';
import { inr } from '@/lib/utils';
import { Trash2, ChevronLeft, Lock, Tag, Truck, Clock, Info, Minus, Plus, ShoppingBag } from 'lucide-react';

export default function Cart() {
  const { items, updateQty, remove, coupon, setCoupon, totals } = useCart();
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');

  const applyCoupon = (e) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (['WELCOME10','FESTIVE500','BULK25'].includes(c)) { setCoupon({ code: c }); setMsg('Coupon applied!'); }
    else { setCoupon(null); setMsg('Invalid coupon code'); }
  };

  return (
    <div>
      <PageHeader title="Your Shopping Cart" subtitle={`${items.length} item${items.length !== 1 ? 's' : ''} in your cart`} breadcrumb={[{ label: 'Cart' }]} />
      <div className="sk-container py-8 md:py-12">
        {items.length === 0 ? (
          <div className="text-center py-16 sk-card p-10 max-w-lg mx-auto">
            <ShoppingBag size={60} className="text-brand-700 mx-auto mb-4" />
            <div className="font-display text-2xl text-brand-900">Your cart is empty</div>
            <p className="text-ink-600 mt-2">Add products or a curated hamper to get started.</p>
            <Link to="/category/all" className="sk-btn-primary mt-5 inline-flex">Start Shopping</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-[1fr_360px] gap-8">
            <div>
              <div className="hidden md:grid grid-cols-[1fr_120px_140px_100px] gap-3 text-[11px] uppercase tracking-widest text-ink-500 pb-3 border-b border-line">
                <div>Product</div><div>Price</div><div>Quantity</div><div className="text-right">Total</div>
              </div>
              {items.map((it) => (
                <div key={it.key} data-testid={`cart-item-${it.id}`} className="grid md:grid-cols-[1fr_120px_140px_100px] gap-3 items-center py-4 border-b border-line">
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-cream-200 shrink-0"><img src={it.image} alt={it.name} className="w-full h-full object-cover" /></div>
                    <div>
                      <div className="font-semibold text-brand-900">{it.name}</div>
                      {it.variant && <div className="text-[12px] text-ink-500">Variant: {it.variant}</div>}
                      {it.meta?.message && <div className="text-[11px] text-ink-500 line-clamp-1">Message: \u201c{it.meta.message}\u201d</div>}
                      <button onClick={() => remove(it.key)} data-testid={`cart-remove-${it.id}`} className="mt-1.5 inline-flex items-center gap-1 text-[12px] text-red-500 hover:underline"><Trash2 size={12} /> Remove</button>
                    </div>
                  </div>
                  <div className="text-brand-900 font-semibold">{inr(it.price)}</div>
                  <div className="inline-flex items-center border border-line-strong rounded-lg w-max">
                    <button onClick={() => updateQty(it.key, it.qty - 1)} aria-label="Decrease" className="p-2"><Minus size={12} /></button>
                    <span className="px-3 min-w-[24px] text-center font-semibold">{it.qty}</span>
                    <button onClick={() => updateQty(it.key, it.qty + 1)} aria-label="Increase" className="p-2"><Plus size={12} /></button>
                  </div>
                  <div className="font-display font-bold text-brand-900 md:text-right">{inr(it.price * it.qty)}</div>
                </div>
              ))}

              <form onSubmit={applyCoupon} className="mt-6 sk-card p-4">
                <div className="font-semibold text-brand-900 flex items-center gap-1.5"><Tag size={14} /> Have a Coupon Code?</div>
                <div className="mt-3 flex gap-2">
                  <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Try WELCOME10 or FESTIVE500" className="sk-input" />
                  <button className="sk-btn-gold whitespace-nowrap">Apply</button>
                </div>
                {msg && <div className={`mt-2 text-[12px] ${coupon ? 'text-[var(--sk-green-500)]' : 'text-[var(--sk-red-500)]'}`}>{msg}</div>}
                {coupon && <div className="mt-2 sk-pill sk-pill-green">Applied: {coupon.code}</div>}
              </form>
              <Link to="/category/all" className="sk-btn-outline mt-4"><ChevronLeft size={14} /> Continue Shopping</Link>
            </div>

            <aside className="sk-card p-5 h-fit md:sticky md:top-4">
              <div className="font-display font-bold text-brand-900 text-lg">Order Summary</div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-ink-600">Subtotal</span><span className="text-brand-900 font-semibold">{inr(totals.subtotal)}</span></div>
                {totals.discount > 0 && <div className="flex justify-between text-[var(--sk-green-500)]"><span>Discount</span><span>–{inr(totals.discount)}</span></div>}
                <div className="flex justify-between"><span className="text-ink-600 inline-flex items-center gap-1">GST (5%) <Info size={11} /></span><span className="text-brand-900">{inr(totals.gst)}</span></div>
                <div className="flex justify-between"><span className="text-ink-600 inline-flex items-center gap-1"><Truck size={12} /> Shipping</span><span className="text-brand-900">{totals.shipping === 0 ? <span className="text-[var(--sk-green-500)] font-semibold">FREE</span> : inr(totals.shipping)}</span></div>
                <div className="border-t border-line pt-2 mt-2 flex justify-between items-end"><span className="font-display text-brand-900">Total</span><span className="font-display font-bold text-brand-900 text-xl">{inr(totals.total)}</span></div>
              </div>
              {totals.subtotal < 799 && totals.subtotal > 0 && (
                <div className="mt-3 text-[12px] text-ink-600 bg-cream-300 p-3 rounded-lg">Add {inr(799 - totals.subtotal)} more for FREE shipping!</div>
              )}
              <div className="mt-3 text-[12px] text-ink-500 flex items-center gap-1"><Clock size={12} /> Estimated delivery: 2–4 business days</div>
              <Link to="/checkout" data-testid="cart-checkout" className="sk-btn-primary w-full mt-5 !py-3.5"><Lock size={16} /> Proceed to Checkout</Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
