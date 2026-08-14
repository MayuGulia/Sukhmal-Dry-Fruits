import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Check, Truck, Copy, ShoppingBag, CreditCard, ClipboardList, Sparkles,
} from 'lucide-react';
import ProductCard, { SectionHeader, TrustStrip } from '@/components/shared/ProductCard';
import { useProducts, ProductSkeleton } from '@/lib/catalog';
import { inr } from '@/lib/utils';

const CELEBRATE_IMG = '/brand/byoh-lifestyle.png';

function loadOrderSnap(orderId) {
  try {
    const raw = sessionStorage.getItem('sk_last_order');
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (orderId && p.orderId && p.orderId !== orderId) return null;
    return p;
  } catch {
    return null;
  }
}

function formatPlacedAt(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return `${date} | ${time}`;
}

function Flourish() {
  return (
    <div className="mx-auto my-4 flex items-center justify-center gap-1.5" aria-hidden>
      <span className="h-px w-12 bg-[var(--sk-gold-400)]/70" />
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--sk-gold-400)]" />
      <span className="w-1 h-1 rounded-full bg-[var(--sk-gold-400)]/60" />
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--sk-gold-400)]" />
      <span className="h-px w-12 bg-[var(--sk-gold-400)]/70" />
    </div>
  );
}

export default function OrderSuccess() {
  const { orderId = 'SKF000000' } = useParams();
  const { data: PRODUCTS, loading } = useProducts({ bestseller: true, limit: 8 });
  const [copied, setCopied] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const snap = useMemo(() => loadOrderSnap(orderId), [orderId]);

  useEffect(() => {
    const t = requestAnimationFrame(() => setCelebrate(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const placedLabel = formatPlacedAt(snap?.placedAt) || new Date().toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const eta = snap?.eta || '2 – 4 Business Days';
  const payLabel = snap?.paymentLabel || 'UPI';
  const isCod = snap?.paymentMethod === 'cod';
  const items = snap?.items || [];
  const totals = snap?.totals;
  const count = snap?.count || items.reduce((s, x) => s + (x.qty || 0), 0);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  return (
    <div>
      <div className="sk-container py-10 md:py-14">
        <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
          {/* Celebration + status */}
          <div className="text-center">
            <div className="relative inline-block mx-auto">
              {/* Sparkles */}
              <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
                {[...Array(12)].map((_, i) => (
                  <Sparkles
                    key={i}
                    size={i % 2 === 0 ? 14 : 10}
                    className={`absolute text-[var(--sk-gold-400)] transition-all duration-700 ${
                      celebrate ? 'opacity-90 scale-100' : 'opacity-0 scale-50'
                    }`}
                    style={{
                      left: `${8 + (i * 7.5) % 84}%`,
                      top: `${4 + (i * 9) % 48}%`,
                      transitionDelay: `${i * 50}ms`,
                    }}
                  />
                ))}
              </div>

              <div
                className={`relative mx-auto w-[200px] h-[160px] md:w-[240px] md:h-[190px] transition-all duration-700 ${
                  celebrate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                }`}
              >
                <img
                  src={CELEBRATE_IMG}
                  alt="Order confirmed — premium dry fruits gift"
                  className="w-full h-full object-contain drop-shadow-md"
                />
                <div
                  className={`absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-white border-2 border-[var(--sk-gold-400)] text-brand-900 grid place-items-center shadow-sk-md transition-transform duration-500 ${
                    celebrate ? 'scale-100' : 'scale-50'
                  }`}
                >
                  <Check size={28} strokeWidth={2.5} className="text-brand-900" />
                </div>
              </div>
            </div>

            <h1 className="font-display text-3xl md:text-5xl text-brand-900 font-bold mt-4">
              Thank You!
            </h1>
            <p className="text-ink-600 mt-2 text-base md:text-lg font-display italic">
              Your order has been placed successfully.
            </p>
            <Flourish />

            <div className="rounded-2xl bg-cream-300/60 border border-line px-4 py-5 md:px-6 md:py-6 text-left">
              <div className="grid sm:grid-cols-3 gap-4 md:gap-5">
                <div className="flex gap-3">
                  <ClipboardList size={22} className="text-brand-900 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wider text-ink-500">Order ID</div>
                    <div className="font-mono font-bold text-brand-900 flex items-center gap-1.5 flex-wrap" data-testid="order-id">
                      {orderId}
                      <button type="button" onClick={copyId} className="text-ink-500 hover:text-brand-900" aria-label="Copy order ID">
                        <Copy size={13} />
                      </button>
                      {copied && <span className="text-[10px] text-[var(--sk-green-500)] font-ui font-semibold">Copied</span>}
                    </div>
                    <div className="text-[11px] text-ink-500 mt-0.5">{placedLabel}</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CreditCard size={22} className="text-brand-900 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-ink-500">Payment Status</div>
                    <div className={`font-semibold ${isCod ? 'text-brand-900' : 'text-[var(--sk-green-500)]'}`}>
                      {isCod ? 'Cash on Delivery' : 'Paid Successfully'}
                    </div>
                    <div className="text-[11px] text-ink-500 mt-0.5">{isCod ? 'Pay when you receive' : `via ${payLabel}`}</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Truck size={22} className="text-brand-900 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-ink-500">Estimated Delivery</div>
                    <div className="font-semibold text-brand-900">{eta}</div>
                    <div className="text-[11px] text-ink-500 mt-0.5">2 – 4 Business Days</div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-ink-600 mt-5 text-center">
                We have sent the order details to your registered email and phone number.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <Link
                to={`/track-order?id=${encodeURIComponent(orderId)}`}
                className="sk-btn-primary !px-6"
                data-testid="track-order-cta"
              >
                <Truck size={16} /> Track Your Order
              </Link>
              <Link to="/category/all" className="sk-btn-outline !px-6" data-testid="continue-shopping">
                <ShoppingBag size={16} /> Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order recap sidebar */}
          <aside className="sk-card p-5 bg-[#FDFBF7] lg:sticky lg:top-24 text-left">
            <div className="font-display font-bold text-brand-900 text-lg text-center">
              Order Summary
              <Flourish />
            </div>

            {items.length > 0 ? (
              <div className="mt-1 space-y-3">
                {items.map((it) => (
                  <div key={it.key || it.id} className="flex items-center gap-2.5">
                    <img
                      src={it.image}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover bg-cream-200 border border-line shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="line-clamp-1 text-brand-900 font-medium text-[13px]">{it.name}</div>
                      <div className="text-[11px] text-ink-500">
                        {[it.variant, `x ${it.qty}`].filter(Boolean).join(' ')}
                      </div>
                    </div>
                    <div className="font-semibold text-brand-900 text-[13px]">{inr(it.price * it.qty)}</div>
                  </div>
                ))}

                {totals && (
                  <div className="border-t border-line pt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-ink-600">Subtotal ({count} Item{count !== 1 ? 's' : ''})</span>
                      <span>{inr(totals.subtotal)}</span>
                    </div>
                    {totals.discount > 0 && (
                      <div className="flex justify-between text-[var(--sk-green-500)]">
                        <span>Discount</span>
                        <span>– {inr(totals.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-ink-600">GST (5%)</span>
                      <span>{inr(totals.gst)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-600">Shipping Charges</span>
                      <span className={totals.shipping === 0 ? 'text-[var(--sk-green-500)] font-bold' : ''}>
                        {totals.shipping === 0 ? 'FREE' : inr(totals.shipping)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-line pt-2.5 mt-2 items-end rounded-lg bg-cream-300/50 -mx-1 px-2 py-2.5">
                      <div>
                        <div className="text-[12px] font-semibold text-brand-900">Total Amount</div>
                        <div className="text-[10px] text-ink-500">Inclusive of all taxes</div>
                      </div>
                      <span className="font-display font-bold text-xl text-brand-900">{inr(totals.total)}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-ink-500 text-center">
                Order <span className="font-mono text-brand-900">{orderId}</span> is confirmed. A full receipt was emailed to you.
              </p>
            )}
          </aside>
        </div>
      </div>

      {/* Cross-sell */}
      <div className="sk-container pb-14">
        <SectionHeader
          title="You May Also Love"
          subtitle="Handpicked for you."
        />
        <div className="sk-scroll-x md:grid md:grid-cols-4 md:gap-4 md:overflow-visible">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
            : (PRODUCTS || []).slice(0, 4).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </div>

      <TrustStrip />
    </div>
  );
}

export function OrderFailed() {
  const { orderId = 'SKF000000' } = useParams();
  return (
    <div className="sk-container py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--sk-red-500)] text-white mx-auto grid place-items-center text-2xl font-bold">
        ✕
      </div>
      <h1 className="font-display text-3xl md:text-4xl text-brand-900 font-bold mt-4">Payment Failed</h1>
      <p className="text-ink-600 mt-2 max-w-lg mx-auto">
        Your payment could not be processed. No amount has been debited. You may retry the payment for the same order or try a different method.
      </p>
      <div className="mt-4 text-sm text-ink-500">
        Order ID: <b className="text-brand-900 font-mono">{orderId}</b>
      </div>
      <div className="mt-6 flex justify-center gap-3 flex-wrap">
        <Link to="/checkout" className="sk-btn-primary">Retry Payment</Link>
        <Link to="/cart" className="sk-btn-outline">Back to Cart</Link>
      </div>
    </div>
  );
}
