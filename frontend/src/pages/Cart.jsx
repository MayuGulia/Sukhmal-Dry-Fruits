import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/Breadcrumb';
import { TrustStrip } from '@/components/shared/ProductCard';
import { useCart } from '@/contexts/CartContext';
import { inr } from '@/lib/utils';
import {
  Trash2, ChevronLeft, Lock, Tag, Truck, Clock, Info, Minus, Plus,
  ShoppingBag, ShieldCheck,
} from 'lucide-react';

const FREE_SHIP = 999;

function Flourish() {
  return (
    <div className="mx-auto mt-2 flex items-center justify-center gap-1.5" aria-hidden>
      <span className="h-px w-8 bg-[var(--sk-gold-400)]/80" />
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--sk-gold-400)]" />
      <span className="w-1 h-1 rounded-full bg-[var(--sk-gold-400)]/70" />
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--sk-gold-400)]" />
      <span className="h-px w-8 bg-[var(--sk-gold-400)]/80" />
    </div>
  );
}

export default function Cart() {
  const { items, updateQty, remove, coupon, setCoupon, totals, count } = useCart();
  const [code, setCode] = useState(coupon?.code || '');
  const [msg, setMsg] = useState('');

  const threshold = totals.freeShippingThreshold ?? FREE_SHIP;
  const remainingForFreeShip = Math.max(0, threshold - (totals.subtotal - totals.discount));
  const hasFreeShip = totals.shipping === 0 && totals.subtotal > 0;

  const applyCoupon = (e) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (['WELCOME10', 'FESTIVE500', 'BULK25'].includes(c)) {
      setCoupon({ code: c });
      setMsg('Coupon applied!');
    } else {
      setCoupon(null);
      setMsg('Invalid coupon code');
    }
  };

  return (
    <div>
      <PageHeader
        title={
          <span className="inline-flex items-center gap-3">
            <ShoppingBag size={36} className="text-brand-900 shrink-0" strokeWidth={1.5} />
            Your Shopping Cart
          </span>
        }
        subtitle={`${count} Item${count !== 1 ? 's' : ''} in your cart`}
        breadcrumb={[{ label: 'Cart' }]}
      />

      <div className="sk-container py-8 md:py-12">
        {items.length === 0 ? (
          <div className="text-center py-16 sk-card p-10 max-w-lg mx-auto">
            <ShoppingBag size={60} className="text-brand-700 mx-auto mb-4" strokeWidth={1.25} />
            <div className="font-display text-2xl text-brand-900">Your cart is empty</div>
            <p className="text-ink-600 mt-2">Add products or a curated hamper to get started.</p>
            <Link to="/category/all" className="sk-btn-primary mt-5 inline-flex">Start Shopping</Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
            <div>
              <div className="sk-card !overflow-visible p-4 md:p-6 bg-white">
                <div className="hidden md:grid grid-cols-[1fr_100px_130px_90px] gap-3 text-[11px] uppercase tracking-[0.14em] text-ink-400 pb-3 border-b border-line">
                  <div>Product</div>
                  <div>Price</div>
                  <div className="text-center">Quantity</div>
                  <div className="text-right">Total</div>
                </div>

                {items.map((it) => (
                  <div
                    key={it.key}
                    data-testid={`cart-item-${it.id}`}
                    className="grid md:grid-cols-[1fr_100px_130px_90px] gap-3 items-center py-5 border-b border-line last:border-b-0"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-[84px] h-[84px] rounded-xl overflow-hidden bg-cream-200 shrink-0 border border-line">
                        <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-display font-semibold text-brand-900 leading-snug text-[15px] md:text-base">
                          {it.name}
                        </div>
                        {(it.variant || it.meta?.tagline) && (
                          <div className="text-[12px] text-ink-500 mt-0.5">
                            {[it.variant, it.meta?.tagline].filter(Boolean).join(' | ')}
                          </div>
                        )}
                        {it.meta?.message && (
                          <div className="text-[11px] text-ink-500 line-clamp-1 mt-0.5">
                            Message: “{it.meta.message}”
                          </div>
                        )}
                        <span className="sk-pill sk-pill-green mt-2 !py-0.5 !px-2.5 text-[11px]">In Stock</span>
                      </div>
                    </div>

                    <div className="text-brand-900 font-semibold flex md:block items-center justify-between">
                      <span className="md:hidden text-[11px] uppercase tracking-wider text-ink-500">Price</span>
                      {inr(it.price)}
                    </div>

                    <div className="flex md:flex-col items-center md:items-center justify-between gap-2">
                      <span className="md:hidden text-[11px] uppercase tracking-wider text-ink-500">Qty</span>
                      <div className="inline-flex items-center border border-line-strong rounded-full bg-white">
                        <button
                          type="button"
                          onClick={() => updateQty(it.key, it.qty - 1)}
                          aria-label="Decrease"
                          className="p-2.5 hover:bg-cream-200 rounded-l-full"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-3 min-w-[28px] text-center font-semibold text-brand-900">{it.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(it.key, it.qty + 1)}
                          aria-label="Increase"
                          className="p-2.5 hover:bg-cream-200 rounded-r-full"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(it.key)}
                        data-testid={`cart-remove-${it.id}`}
                        className="flex items-center gap-1 text-[12px] text-ink-500 hover:text-[var(--sk-red-500)]"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>

                    <div className="font-semibold text-brand-900 md:text-right flex md:block items-center justify-between">
                      <span className="md:hidden text-[11px] uppercase tracking-wider text-ink-500 font-normal">Total</span>
                      {inr(it.price * it.qty)}
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={applyCoupon}
                className="mt-5 rounded-xl border border-line bg-cream-300/70 p-4 md:p-5"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                  <div className="flex-1 flex items-start gap-2.5">
                    <Tag size={18} className="text-brand-900 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-brand-900 text-sm">Have a Coupon Code?</div>
                      <p className="text-[12px] text-ink-500 mt-0.5">Apply it for extra discounts</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto md:min-w-[320px]">
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Enter coupon code"
                      className="sk-input !bg-white"
                      data-testid="cart-coupon-input"
                    />
                    <button type="submit" className="sk-btn-primary whitespace-nowrap !px-5" data-testid="cart-coupon-apply">
                      Apply
                    </button>
                  </div>
                </div>
                {msg && (
                  <div className={`mt-2 text-[12px] ${coupon ? 'text-[var(--sk-green-500)]' : 'text-[var(--sk-red-500)]'}`}>
                    {msg}
                  </div>
                )}
                {coupon && <div className="mt-2 sk-pill sk-pill-green">Applied: {coupon.code}</div>}
              </form>

              <Link to="/category/all" className="sk-btn-outline mt-5 inline-flex !py-2.5 !px-4 text-sm">
                <ChevronLeft size={14} /> Continue Shopping
              </Link>
            </div>

            <aside className="space-y-3 lg:sticky lg:top-24">
              <div className="flex items-center gap-2.5 rounded-xl border border-[var(--sk-cream-400)] bg-[var(--sk-cream-300)]/80 px-3.5 py-2.5">
                <ShieldCheck size={18} className="text-[var(--sk-gold-500)] shrink-0" />
                <div className="text-[12px] text-brand-900 leading-snug">
                  <span className="font-semibold">Secure Checkout</span>
                  <span className="text-ink-500"> | 100% Safe &amp; Secure Payments</span>
                </div>
              </div>

              <div className="sk-card p-5 bg-[#FDFBF7]">
                <div className="font-display font-bold text-brand-900 text-xl text-center">
                  Order Summary
                  <Flourish />
                </div>

                <div className="mt-5 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink-600">Subtotal ({count} Item{count !== 1 ? 's' : ''})</span>
                    <span className="text-brand-900 font-semibold">{inr(totals.subtotal)}</span>
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between text-[var(--sk-green-500)]">
                      <span>Discount</span>
                      <span className="font-semibold">– {inr(totals.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-ink-600">GST (5%)</span>
                    <span className="text-brand-900">{inr(totals.gst)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-600 inline-flex items-center gap-1">
                      Shipping Charges <Info size={11} className="text-ink-400" />
                    </span>
                    <span className="text-brand-900">
                      {hasFreeShip ? (
                        <span className="text-[var(--sk-green-500)] font-bold tracking-wide">FREE</span>
                      ) : (
                        inr(totals.shipping)
                      )}
                    </span>
                  </div>

                  <div className="border-t border-dashed border-line-strong pt-3.5 mt-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="font-display text-brand-700 font-semibold text-lg">You Pay</div>
                        <div className="text-[11px] text-ink-500 mt-0.5">Inclusive of all taxes</div>
                      </div>
                      <span className="font-display font-bold text-brand-700 text-2xl">{inr(totals.total)}</span>
                    </div>
                  </div>
                </div>

                {hasFreeShip ? (
                  <div className="mt-4 text-[12px] text-[var(--sk-green-500)] bg-[var(--sk-green-100)] p-3 rounded-lg flex items-start gap-2">
                    <Truck size={14} className="mt-0.5 shrink-0" />
                    <span>
                      <b>Free Shipping</b>
                      <span className="text-ink-600"> | Yay! You&apos;ve unlocked free delivery.</span>
                    </span>
                  </div>
                ) : (
                  <div className="mt-4 text-[12px] text-ink-600 bg-cream-300 p-3 rounded-lg flex items-start gap-2">
                    <Truck size={14} className="mt-0.5 shrink-0 text-brand-900" />
                    <span>
                      Add <b className="text-brand-900">{inr(remainingForFreeShip)}</b> more for FREE shipping on orders ₹{threshold}+
                    </span>
                  </div>
                )}

                <div className="mt-3 text-[12px] text-ink-600 flex items-center gap-1.5 justify-center">
                  <Clock size={12} className="text-brand-900" />
                  <span>
                    <b className="font-medium text-brand-900">Estimated Delivery:</b> 2 – 4 Business Days
                  </span>
                </div>

                <Link
                  to="/checkout"
                  data-testid="cart-checkout"
                  className="sk-btn-primary w-full mt-5 !py-3.5"
                >
                  <Lock size={15} /> Proceed to Checkout
                </Link>
                <div className="text-center text-[10px] text-ink-500 mt-2">Secure &amp; Fast Checkout</div>
              </div>
            </aside>
          </div>
        )}
      </div>

      <TrustStrip />
    </div>
  );
}
