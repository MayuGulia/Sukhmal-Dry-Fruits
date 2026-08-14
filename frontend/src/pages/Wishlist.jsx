import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { useProducts, ProductSkeleton } from '@/lib/catalog';
import { Heart, ShoppingBag, X, ArrowRight, Star } from 'lucide-react';
import { inr } from '@/lib/utils';

const FALLBACK_WEIGHTS = ['250g', '500g', '1kg'];

function WeightPills({ variants, selected, onSelect }) {
  const opts = (variants?.length ? variants.map((v) => v.w) : FALLBACK_WEIGHTS).slice(0, 3);
  return (
    <div className="flex flex-wrap gap-1.5">
      {opts.map((w) => {
        const active = selected === w;
        return (
          <button
            key={w}
            type="button"
            onClick={() => onSelect(w)}
            className={`min-w-[52px] px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
              active
                ? 'bg-cream-300 text-brand-900 border-[var(--sk-line-strong)]'
                : 'bg-cream-100/80 text-brand-900 border-line hover:border-[var(--sk-line-strong)]'
            }`}
          >
            {w}
          </button>
        );
      })}
    </div>
  );
}

function Stars({ rating = 4 }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full || (i === full && half);
        return (
          <Star
            key={i}
            size={12}
            className={filled ? 'sk-star fill-current' : 'text-line-strong'}
            fill={filled ? 'currentColor' : 'none'}
          />
        );
      })}
    </div>
  );
}

function WishlistCard({ product, onRemove, onMove }) {
  const variants = product.variants || [];
  const [weight, setWeight] = useState(variants[0]?.w || FALLBACK_WEIGHTS[0]);
  const variant = variants.find((v) => v.w === weight) || variants[0];
  const price = variant?.price ?? product.price;

  return (
    <article className="sk-card flex flex-col overflow-hidden group sk-fade-up">
      <div className="flex gap-3 p-3 pb-2.5 flex-1 min-h-0">
        {/* Image — left */}
        <div className="relative w-[42%] max-w-[132px] shrink-0 aspect-square rounded-xl overflow-hidden bg-cream-200">
          <Link to={`/product/${product.slug}`} className="block h-full w-full">
            <img
              src={product.images?.[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </Link>
          <span
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/95 grid place-items-center text-brand-900 shadow-sk-sm"
            aria-hidden
          >
            <Heart size={13} strokeWidth={1.75} />
          </span>
        </div>

        {/* Details — right */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5 pt-0.5 relative pr-5">
          <button
            type="button"
            onClick={() => onRemove(product.id)}
            aria-label={`Remove ${product.name}`}
            className="absolute top-0 right-0 h-6 w-6 grid place-items-center text-ink-500 hover:text-brand-900"
          >
            <X size={14} strokeWidth={2} />
          </button>

          <div>
            <Link
              to={`/product/${product.slug}`}
              className="font-semibold text-brand-900 text-[14px] leading-snug line-clamp-1 hover:underline"
            >
              {product.name}
            </Link>
            {product.tagline && (
              <div className="text-[11px] text-ink-500 mt-0.5 line-clamp-1">{product.tagline}</div>
            )}
          </div>

          <WeightPills variants={variants} selected={weight} onSelect={setWeight} />

          <div className="flex items-center gap-1.5 text-[11px] text-ink-500">
            <Stars rating={product.rating || 4} />
            <span>({product.reviews || 0})</span>
          </div>

          <div className="font-display font-bold text-brand-900 text-[17px] leading-none mt-auto pt-1">
            {inr(price)}{' '}
            <span className="text-[11px] font-ui font-medium text-ink-500">Onwards</span>
          </div>
        </div>
      </div>

      {/* Actions — full width 50/50 */}
      <div className="grid grid-cols-2 gap-2 px-3 pb-3 mt-auto">
        <button
          type="button"
          onClick={() => onMove(product, variant || { w: weight, price })}
          className="sk-btn-primary !py-2 !px-2 !rounded-lg text-[12px] justify-center"
        >
          <ShoppingBag size={13} /> Move to Cart
        </button>
        <button
          type="button"
          onClick={() => onRemove(product.id)}
          className="sk-btn-outline !py-2 !px-2 !rounded-lg text-[12px] justify-center"
        >
          Remove
        </button>
      </div>
    </article>
  );
}

function ExploreBanner() {
  return (
    <div className="mt-10 md:mt-14 rounded-2xl bg-cream-300/90 border border-line px-5 py-5 md:px-8 md:py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
      <div className="h-12 w-12 shrink-0 rounded-full bg-[var(--sk-cream-400)] grid place-items-center text-brand-900">
        <Heart size={20} strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-brand-900 text-lg md:text-xl leading-snug">
          Don&apos;t see something you like?
        </p>
        <p className="text-ink-600 text-sm mt-1 leading-relaxed">
          Explore our wide range of premium dry fruits and gift hampers.
        </p>
      </div>
      <Link to="/category/all" className="sk-btn-primary text-sm shrink-0 !rounded-lg">
        Explore All Products <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function EmptyWishlist() {
  return (
    <div className="sk-card p-10 md:p-14 text-center max-w-lg mx-auto">
      <div className="mx-auto h-16 w-16 rounded-full bg-cream-300 grid place-items-center">
        <Heart size={28} className="text-brand-900" strokeWidth={1.5} />
      </div>
      <div className="font-display text-2xl md:text-3xl mt-5 text-brand-900 font-bold">
        Your wishlist is empty
      </div>
      <p className="text-ink-600 mt-2 text-sm md:text-base">
        Save your favorite products and buy them anytime.
      </p>
      <Link to="/category/all" className="sk-btn-primary mt-6 inline-flex !rounded-lg">
        Continue Shopping <ArrowRight size={15} />
      </Link>
    </div>
  );
}

export default function Wishlist() {
  const { ids, toggle, clear } = useWishlist();
  const { add } = useCart();
  const { data: allProducts, loading } = useProducts({ limit: 200 });
  const items = useMemo(() => allProducts.filter((p) => ids.includes(p.id)), [allProducts, ids]);
  const [movedFlash, setMovedFlash] = useState(null);

  const moveOne = (product, variant) => {
    add(product, { qty: 1, variant });
    toggle(product.id);
    setMovedFlash(product.name);
    window.setTimeout(() => setMovedFlash(null), 2200);
  };

  const moveAll = () => {
    items.forEach((p) => {
      const v = p.variants?.[0] || { w: '250g', price: p.price };
      add(p, { qty: 1, variant: v });
    });
    clear();
    setMovedFlash('all items');
    window.setTimeout(() => setMovedFlash(null), 2200);
  };

  const countLabel =
    items.length === 1 ? '(1 Item)' : `(${items.length} Items)`;

  return (
    <div className="min-h-[60vh] bg-[var(--sk-cream-100)]">
      <div className="sk-container pt-6 md:pt-8 pb-2">
        <Breadcrumb items={[{ label: 'My Account', to: '/account' }, { label: 'Wishlist' }]} />
      </div>

      <div className="sk-container py-5 md:py-8 pb-12 md:pb-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-7 md:mb-9">
          <div>
            <h1 className="font-display font-bold text-brand-900 text-3xl md:text-[2.35rem] leading-tight tracking-tight">
              My Wishlist {loading ? '' : countLabel}
            </h1>
            <p className="text-ink-600 mt-2 text-sm md:text-[15px] max-w-xl">
              Save your favorite products and buy them anytime.
            </p>
          </div>
          {!loading && items.length > 0 && (
            <div className="flex flex-wrap gap-2.5">
              <button type="button" onClick={moveAll} className="sk-btn-outline text-sm !rounded-lg !bg-white">
                <ShoppingBag size={15} /> Move All to Cart
              </button>
              <Link to="/category/all" className="sk-btn-primary text-sm !rounded-lg">
                Continue Shopping <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </div>

        {movedFlash && (
          <div className="mb-6 rounded-xl bg-[var(--sk-green-100)] text-[var(--sk-green-500)] px-4 py-3 text-sm font-medium">
            Moved {movedFlash} to cart.
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyWishlist />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {items.map((p) => (
              <WishlistCard key={p.id} product={p} onRemove={toggle} onMove={moveOne} />
            ))}
          </div>
        )}

        <ExploreBanner />
      </div>
    </div>
  );
}
