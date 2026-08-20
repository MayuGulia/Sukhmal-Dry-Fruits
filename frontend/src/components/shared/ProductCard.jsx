import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus, Star, Check, Leaf, Hand, Gift, Truck } from 'lucide-react';
import { inr } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { packVariants } from '@/lib/commerceStore';
import { boxCatalogShot } from '@/lib/liveCatalog';

/** Product catalog cards use the packaged jar/box (gallery image 2). Gift hampers stay on image 1. */
export function listingImage(p) {
  return boxCatalogShot(p) || p?.img || p?.image || '';
}

function usesPackShot(p) {
  return Boolean(listingImage(p));
}

function listingImgClass(p) {
  const fit = usesPackShot(p)
    ? 'absolute inset-0 w-full h-full object-contain bg-white'
    : 'w-full h-full object-cover';
  return `${fit} group-hover:scale-[1.02] transition-transform duration-500`;
}

function listingWellClass(p) {
  return usesPackShot(p)
    ? 'relative block aspect-square overflow-hidden bg-white'
    : 'relative block aspect-square overflow-hidden bg-cream-200';
}

function shortSubtitle(p) {
  if (p.subcategory) return p.subcategory;
  const raw = String(p.tagline || '').split(/[—–.]/)[0].trim();
  if (!raw) return '';
  return raw.length > 36 ? `${raw.slice(0, 34)}…` : raw;
}

function StarRow({ rating = 0, reviews = 0 }) {
  return (
    <div className="flex items-center gap-0.5 mt-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = rating >= i;
        const half = !filled && rating >= i - 0.5;
        return (
          <span key={i} className="relative inline-flex h-3.5 w-3.5">
            <Star
              size={14}
              className="text-[#E0D6C8]"
              fill="currentColor"
              strokeWidth={0}
            />
            {(filled || half) && (
              <span
                className="absolute inset-0 overflow-hidden sk-star"
                style={{ width: half ? '50%' : '100%' }}
              >
                <Star size={14} fill="currentColor" strokeWidth={0} />
              </span>
            )}
          </span>
        );
      })}
      <span className="text-[12px] text-ink-500 ml-1.5 tabular-nums">({reviews})</span>
    </div>
  );
}

export default function ProductCard({ p, variant = 'default' }) {
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const active = has(p.id);
  const labeled = variant === 'labeled';
  const variants = packVariants(p);
  const preferredIdx = Math.max(0, variants.findIndex((v) => /500/i.test(String(v.w))));
  const [vi, setVi] = useState(preferredIdx >= 0 ? preferredIdx : 0);
  const selected = variants[Math.min(vi, Math.max(variants.length - 1, 0))] || variants[0];
  const price = selected?.price ?? p.price;
  const subtitle = shortSubtitle(p);
  const liveVariant = (p.weightVariants || []).find((v) => v.weight === selected?.w) || p.weightVariants?.[vi];
  const stock = typeof liveVariant?.stock === 'number' ? liveVariant.stock : (typeof selected?.stock === 'number' ? selected.stock : 20);
  const oos = stock <= 0;

  if (labeled) {
    const pack = variants.find((v) => /500/i.test(String(v.w))) || variants[0];
    return (
      <div data-testid={`product-card-${p.slug}`} className="sk-card group flex flex-col w-full h-full bg-white">
        <Link to={`/product/${p.slug}`} className={listingWellClass(p)}>
          <img src={listingImage(p)} alt={p.name} className={listingImgClass(p)} loading="lazy" decoding="async" />
          {p.bestseller && <span className="sk-pill sk-pill-brown absolute top-2 left-2 !py-1 !px-2.5">Bestseller</span>}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(p.id); }}
            aria-label="Wishlist"
            className="absolute top-2 right-2 h-9 w-9 rounded-full bg-white/95 grid place-items-center shadow-sk-sm text-brand-900"
          >
            <Heart size={16} fill={active ? 'currentColor' : 'none'} className={active ? 'text-red-500' : ''} />
          </button>
        </Link>
        <div className="p-3.5 flex flex-col gap-1.5 flex-1">
          <Link
            to={`/product/${p.slug}`}
            className="font-display font-bold text-[15px] md:text-base text-brand-900 leading-tight line-clamp-2"
          >
            {p.name}{pack?.w ? ` (${pack.w})` : ''}
          </Link>
          <div className="flex items-center gap-1 text-[12px] text-ink-600">
            <Star size={13} className="sk-star fill-current" />
            <span className="font-medium text-brand-900">{Number(p.rating).toFixed(1)}</span>
            <span>({p.reviews})</span>
          </div>
          <div className="mt-auto pt-2.5 space-y-2.5">
            <div className="font-display font-bold text-brand-900 text-[1.2rem] leading-none tracking-tight">{inr(pack?.price ?? p.price)}</div>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); add(p, { qty: 1, variant: pack }); }}
              disabled={typeof pack?.stock === 'number' ? pack.stock <= 0 : false}
              data-testid={`add-cart-${p.slug}`}
              className="w-full !py-2.5 !rounded-[10px] text-[13px] tracking-wide font-semibold text-white bg-[var(--sk-espresso)] hover:bg-[#2a1e16] transition-colors disabled:opacity-40"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid={`product-card-${p.slug}`} className="sk-card group flex flex-col w-full overflow-hidden">
      <Link to={`/product/${p.slug}`} className={listingWellClass(p)}>
        <img
          src={listingImage(p)}
          alt={p.name}
          className={listingImgClass(p)}
          loading="lazy"
          decoding="async"
        />
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(p.id); }}
          aria-label="Wishlist"
          className={`absolute top-2.5 right-2.5 drop-shadow-md ${active ? 'text-red-500' : usesPackShot(p) ? 'text-brand-900/80' : 'text-white'}`}
        >
          <Heart size={22} strokeWidth={1.6} fill={active ? 'currentColor' : 'none'} />
        </button>
      </Link>

      <div className="p-3.5 md:p-4 flex flex-col gap-1.5 flex-1">
        <Link
          to={`/product/${p.slug}`}
          className="font-display font-bold text-[17px] md:text-lg text-brand-900 leading-snug line-clamp-1"
        >
          {p.name}
        </Link>
        {subtitle && (
          <div className="text-[12px] md:text-[13px] text-ink-500 leading-snug line-clamp-1 -mt-0.5">
            {subtitle}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mt-1">
          {variants.slice(0, 3).map((v, i) => {
            const on = i === vi;
            const vs = (p.weightVariants || []).find((x) => x.weight === v.w);
            const gone = typeof vs?.stock === 'number' ? vs.stock <= 0 : false;
            return (
              <button
                key={v.w}
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setVi(i); }}
                className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                  gone ? 'line-through opacity-60 ' : ''
                }${
                  on
                    ? 'border-[var(--sk-gold-500)] bg-[rgba(197,160,89,0.12)] text-brand-900'
                    : 'border-line bg-cream-100 text-ink-600 hover:border-line-strong'
                }`}
              >
                {v.w}{gone ? ' · Out of Stock' : ''}
              </button>
            );
          })}
        </div>

        <StarRow rating={p.rating} reviews={p.reviews} />

        <div className="mt-auto pt-2.5 flex items-end justify-between gap-2">
          <div className="font-display font-bold text-brand-900 text-[1.15rem] md:text-xl leading-none tracking-tight">
            {inr(price).replace('₹', '₹ ')}
            <span className="text-[12px] md:text-[13px] font-sans font-medium text-ink-600 ml-1.5">
              Onwards
            </span>
          </div>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); add(p, { qty: 1, variant: selected }); }}
            aria-label="Add to cart"
            disabled={oos}
            data-testid={`add-cart-${p.slug}`}
            className="h-10 w-10 rounded-full bg-brand-900 text-white grid place-items-center shrink-0 hover:bg-brand-700 shadow-sk-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={18} strokeWidth={2.25} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function HamperCard({ h }) {
  return (
    <Link to={`/gift-hampers/${h.slug}`} data-testid={`hamper-card-${h.slug}`} className="sk-card block group">
      <div className="relative aspect-[4/5] overflow-hidden bg-cream-200">
        <img src={h.image} alt={h.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        <span className="sk-pill sk-pill-gold absolute top-3 left-3">{h.tier}</span>
      </div>
      <div className="p-4">
        <div className="text-[11px] uppercase tracking-wider text-ink-500">{h.weight}</div>
        <div className="font-display font-bold text-brand-900 text-lg leading-tight mt-1">{h.name}</div>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <div className="font-display text-brand-900 text-xl font-bold">{inr(h.price)}</div>
            {h.mrp > h.price && <div className="text-[11px] text-ink-500 line-through">{inr(h.mrp)}</div>}
          </div>
          <span className="sk-btn-primary !py-2 !px-3.5 text-[12px]">View <Check size={12} /></span>
        </div>
      </div>
    </Link>
  );
}

export function SectionHeader({ eyebrow, title, subtitle, cta }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
      <div>
        {eyebrow && <div className="sk-section-eyebrow">{eyebrow}</div>}
        <h2 className="sk-section-title text-2xl md:text-4xl mt-1.5">{title}</h2>
        {subtitle && <p className="text-ink-600 mt-2 text-sm md:text-base max-w-2xl">{subtitle}</p>}
      </div>
      {cta}
    </div>
  );
}

export function TrustStrip({ overlay = false }) {
  const items = [
    { Ic: Leaf, label: '100% Natural', sub: 'No Preservatives' },
    { Ic: Hand, label: 'Handpicked Quality', sub: 'Finest from Around the World' },
    { Ic: Gift, label: 'Premium Packaging', sub: 'Made for Gifting' },
    { Ic: Truck, label: 'Express Delivery', sub: 'Across India' },
  ];
  const inner = (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-6 py-5 md:py-6">
      {items.map(({ Ic, label, sub }, i) => (
        <div
          key={label}
          className={`flex items-center gap-3.5 justify-center px-2 ${
            i > 0 ? 'lg:border-l lg:border-[#E8DFD3]' : ''
          }`}
        >
          <div className="shrink-0 h-10 w-10 grid place-items-center rounded-full border-2 border-[#D4AF37] text-[#C59B27] bg-white">
            <Ic size={16} strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <div className="font-display font-semibold text-[14px] md:text-[15px] leading-tight tracking-[0.02em] text-[var(--sk-brown-900)]">
              {label}
            </div>
            <div className="text-[11px] mt-0.5 leading-snug tracking-[0.04em] text-[var(--sk-brown-700)]">{sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
  if (overlay) {
    return (
      <div className="sk-trust-mix">
        <div className="sk-container">{inner}</div>
      </div>
    );
  }
  return (
    <div className="bg-white border-b border-[#EDE6DC]">
      <div className="sk-container">{inner}</div>
    </div>
  );
}
