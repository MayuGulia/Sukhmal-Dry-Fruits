import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus, Star, Check } from 'lucide-react';
import { inr } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';

export default function ProductCard({ p, variant = 'default' }) {
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const active = has(p.id);
  const disc = p.mrp ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;

  return (
    <div data-testid={`product-card-${p.slug}`} className="sk-card group flex flex-col w-[210px] md:w-auto">
      <Link to={`/product/${p.slug}`} className="relative block aspect-square overflow-hidden bg-cream-200">
        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        {p.bestseller && <span className="sk-pill sk-pill-brown absolute top-2 left-2 !py-1 !px-2.5">Bestseller</span>}
        {disc > 0 && <span className="sk-pill sk-pill-gold absolute top-2 right-2 !py-1 !px-2.5">{disc}% OFF</span>}
        <button onClick={(e) => { e.preventDefault(); toggle(p.id); }} aria-label="Wishlist" className={`absolute bottom-2 right-2 h-9 w-9 rounded-full bg-white/95 grid place-items-center shadow-sk-sm ${active ? 'text-red-500' : 'text-brand-900'}`}>
          <Heart size={16} fill={active ? 'currentColor' : 'none'} />
        </button>
      </Link>
      <div className="p-3.5 flex flex-col gap-1.5 flex-1">
        <div className="text-[11px] uppercase tracking-wider text-ink-500">{p.tagline}</div>
        <Link to={`/product/${p.slug}`} className="font-semibold text-brand-900 leading-tight text-[15px] line-clamp-2">{p.name}</Link>
        <div className="flex items-center gap-1 text-[12px] text-ink-600">
          <Star size={13} className="sk-star fill-current" />
          <span className="font-medium text-brand-900">{p.rating}</span>
          <span>({p.reviews})</span>
        </div>
        <div className="mt-1.5 flex items-end justify-between gap-2">
          <div>
            <div className="font-display font-bold text-brand-900 text-lg leading-none">{inr(p.price)}</div>
            {p.mrp && p.mrp > p.price && <div className="text-[11px] text-ink-500 line-through leading-none mt-0.5">MRP {inr(p.mrp)}</div>}
          </div>
          <button onClick={() => add(p, { qty: 1, variant: p.variants?.[0] })} aria-label="Add to cart" data-testid={`add-cart-${p.slug}`} className="h-9 w-9 rounded-lg bg-brand-900 text-white grid place-items-center hover:bg-brand-700">
            <Plus size={16} />
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

export function TrustStrip() {
  const items = [
    { icon: '🌿', label: '100% Natural' },
    { icon: '👐', label: 'Handpicked Quality' },
    { icon: '🎁', label: 'Premium Packaging' },
    { icon: '🚚', label: 'Express Delivery' },
  ];
  return (
    <div className="bg-white border-y border-line">
      <div className="sk-container grid grid-cols-2 md:grid-cols-4 gap-y-4 py-6">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-3 justify-center">
            <div className="text-2xl">{it.icon}</div>
            <div className="font-semibold text-brand-900 text-sm md:text-base">{it.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
