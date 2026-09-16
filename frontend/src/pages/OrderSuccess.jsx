import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Check, Truck, Copy, ShoppingBag, CreditCard, ClipboardList,
} from 'lucide-react';
import ProductCard, { SectionHeader, TrustStrip } from '@/components/shared/ProductCard';
import { useProducts, ProductSkeleton } from '@/lib/catalog';
import { getOrderById } from '@/lib/orders';
import { isHamperLine, orderItemImage } from '@/lib/orderImages';
import { estimateDeliveryByPincode } from '@/lib/deliveryEstimate';
import { inr } from '@/lib/utils';
import { trackEvent } from '@/lib/analyticsEvents';

const FALLBACK_IMG = '/brand/byoh-lifestyle.png';

function resolveItemImage(it) {
  return orderItemImage(it) || FALLBACK_IMG;
}

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
  const [remote, setRemote] = useState(null);

  const snap = useMemo(() => loadOrderSnap(orderId), [orderId]);

  useEffect(() => {
    trackEvent('order_placed', { productId: orderId, metadata: { orderId } });
  }, [orderId]);

  useEffect(() => {
    const t = requestAnimationFrame(() => setCelebrate(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    let on = true;
    getOrderById(orderId).then((row) => {
      if (on) setRemote(row);
    }).catch(() => {});
    return () => { on = false; };
  }, [orderId]);

  const items = useMemo(() => {
    if (Array.isArray(snap?.items) && snap.items.length) return snap.items;
    if (Array.isArray(remote?.raw?.items) && remote.raw.items.length) {
      return remote.raw.items.map((it) => ({
        ...it,
        id: it.productId || it.id,
        key: it.key || it.productId || it.id,
      }));
    }
    return remote?.lines || [];
  }, [snap, remote]);

  const placedLabel = formatPlacedAt(snap?.placedAt) || remote?.placedAt || new Date().toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const pin = snap?.address?.pincode || remote?.address?.pincode;
  const guess = estimateDeliveryByPincode(pin);
  const eta = snap?.estimatedDeliveryDate || snap?.eta || remote?.estimatedDeliveryDate || remote?.eta || guess.label;
  const etaWindow = snap?.estimatedDeliveryWindow || remote?.estimatedDeliveryWindow || guess.window;
  const payLabel = snap?.paymentLabel || 'UPI';
  const isCod = (snap?.paymentMethod || remote?.paymentMethod) === 'cod';
  const totals = snap?.totals || (remote ? { ...remote.summary, total: remote.total } : null);
  const count = snap?.count || items.reduce((s, x) => s + (Number(x.qty) || 0), 0);
  const hamperItems = items.filter(isHamperLine);
  const heroItem = hamperItems[0] || items[0] || null;
  const heroSrc = resolveItemImage(heroItem);
  const heroIsHamper = Boolean(heroItem && isHamperLine(heroItem));
  const extraShots = items
    .filter((it) => it !== heroItem)
    .slice(0, 4)
    .map((it) => ({ src: resolveItemImage(it), alt: it.name, hamper: isHamperLine(it) }))
    .filter((x) => x.src && x.src !== FALLBACK_IMG);

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
            <div
              className={`relative mx-auto w-full max-w-[22rem] sm:max-w-[26rem] transition-all duration-700 ${
                celebrate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              }`}
            >
              <div className="relative mx-auto w-[13.5rem] sm:w-[16rem]">
                <div className={`relative overflow-hidden bg-white ring-1 ring-[var(--sk-line)] shadow-[0_16px_36px_rgba(60,36,21,0.12)] ${
                  heroIsHamper ? 'rounded-2xl aspect-[4/3]' : 'rounded-2xl aspect-square'
                }`}>
                  <img
                    src={heroSrc}
                    alt={heroItem?.name || 'Your order'}
                    className={heroIsHamper ? 'w-full h-full object-cover' : 'w-full h-full object-contain p-4 bg-white'}
                    data-testid="order-hero-image"
                  />
                </div>
                <div
                  className={`absolute -top-2.5 left-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-white border-2 border-[var(--sk-gold-400)] text-brand-900 grid place-items-center shadow-sk-md transition-transform duration-500 ${
                    celebrate ? 'scale-100' : 'scale-50'
                  }`}
                >
                  <Check size={22} strokeWidth={2.5} className="text-brand-900" />
                </div>
              </div>

              {extraShots.length > 0 && (
                <div className="mt-4 flex justify-center gap-2 flex-wrap">
                  {extraShots.map((shot) => (
                    <div
                      key={shot.alt}
                      className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-line shadow-sk-sm"
                    >
                      <img
                        src={shot.src}
                        alt={shot.alt}
                        className={shot.hamper ? 'w-full h-full object-cover' : 'w-full h-full object-contain p-1'}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {heroItem?.name && (
              <p className="mt-1 text-[11px] font-semibold tracking-[0.16em] uppercase text-[var(--sk-gold-600)]">
                {heroItem.name}
                {heroItem.variant ? ` · ${heroItem.variant}` : ''}
              </p>
            )}

            <h1 className="font-display text-3xl md:text-5xl text-brand-900 font-bold mt-3">
              Thank You!
            </h1>
            <p className="text-ink-600 mt-2 text-base md:text-lg font-display italic">
              Your order has been placed successfully.
            </p>
            <Flourish />

            <div className="rounded-2xl bg-[#FBF6EE] border border-[var(--sk-line)] px-4 py-5 md:px-6 md:py-6 text-left shadow-[0_10px_28px_rgba(60,36,21,0.05)]">
              <div className="grid sm:grid-cols-3 gap-4 md:gap-5">
                <div className="flex gap-3">
                  <span className="w-10 h-10 rounded-full bg-white border border-line grid place-items-center shrink-0 shadow-sk-sm">
                    <ClipboardList size={18} className="text-brand-900" strokeWidth={1.5} />
                  </span>
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
                  <span className="w-10 h-10 rounded-full bg-white border border-line grid place-items-center shrink-0 shadow-sk-sm">
                    <CreditCard size={18} className="text-brand-900" strokeWidth={1.5} />
                  </span>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-ink-500">Payment Status</div>
                    <div className={`font-semibold ${isCod ? 'text-brand-900' : 'text-[var(--sk-green-500)]'}`}>
                      {isCod ? 'Cash on Delivery' : 'Paid Successfully'}
                    </div>
                    <div className="text-[11px] text-ink-500 mt-0.5">{isCod ? 'Pay when you receive' : `via ${payLabel}`}</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="w-10 h-10 rounded-full bg-white border border-line grid place-items-center shrink-0 shadow-sk-sm">
                    <Truck size={18} className="text-brand-900" strokeWidth={1.5} />
                  </span>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-ink-500">Estimated Delivery</div>
                    <div className="font-semibold text-brand-900">{eta}</div>
                    <div className="text-[11px] text-ink-500 mt-0.5">{etaWindow}</div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-ink-600 mt-5 text-center">
                A confirmation email has been sent to your account address, and the store has been notified. Save your Order ID to track this order.
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
                      src={resolveItemImage(it)}
                      alt={it.name}
                      className={`w-12 h-12 rounded-lg object-contain p-1 bg-white border border-line shrink-0 ${
                        isHamperLine(it) ? 'object-cover p-0' : ''
                      }`}
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
                Order <span className="font-mono text-brand-900">{orderId}</span> is confirmed. Save this ID to track it.
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
