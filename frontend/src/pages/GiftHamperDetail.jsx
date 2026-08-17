import React, { useMemo, useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Award, Calendar, CheckCircle2, ChevronLeft, ChevronRight, Gift, Heart, Leaf, Loader,
  Minus, Package, Plus, ShieldCheck, ShoppingBag, Star, Truck,
} from 'lucide-react';
import { useHamper, useHampers } from '@/lib/catalog';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { inr, cn } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { PremiumHamperCard } from '@/pages/GiftHampers';

const DETAIL_BULLETS = [
  'Perfect for weddings and engagements',
  'Elegant gift packaging',
  'Premium quality nuts & dry fruits',
  'Hygienically packed for freshness',
];

const MID_TRUST = [
  { Ic: Package, label: 'Fresh & Hygienically Packed' },
  { Ic: Leaf, label: 'No Preservatives' },
  { Ic: ShieldCheck, label: '100% Natural Ingredients' },
  { Ic: Gift, label: 'Perfect for Every Occasion' },
];

const TRUST_ROW = [
  { Ic: Award, label: 'Premium Quality' },
  { Ic: Leaf, label: 'Handpicked' },
  { Ic: Gift, label: 'Elegant Packaging' },
  { Ic: Truck, label: 'Express Delivery' },
];

function parseContents(contents = []) {
  return contents.map((c) => {
    if (typeof c === 'object' && c?.name) return { name: c.name, weight: c.weight || '', image: c.image };
    const str = String(c);
    const m = str.match(/^(.+?)\s+(\d+(?:\.\d+)?\s*(?:g|kg|ml))$/i);
    if (m) return { name: m[1].trim(), weight: m[2].replace(/\s+/g, ''), image: null };
    return { name: str, weight: '', image: null };
  });
}

function ratingBars(reviews) {
  const total = Math.max(1, reviews);
  return [
    { star: 5, pct: 72 },
    { star: 4, pct: 18 },
    { star: 3, pct: 6 },
    { star: 2, pct: 2 },
    { star: 1, pct: 2 },
  ].map((r) => ({ ...r, count: Math.round((r.pct / 100) * total) }));
}

export default function GiftHamperDetail() {
  const { slug } = useParams();
  const { data: h, loading } = useHamper(slug);
  const { data: allHampers } = useHampers();
  const [msg, setMsg] = useState('');
  const [date, setDate] = useState('');
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [toast, setToast] = useState('');
  const { add } = useCart();
  const { has, toggle } = useWishlist();

  const items = useMemo(() => parseContents(h?.contents || []), [h]);
  const totalWeightLabel = h?.weight || '—';
  const gallery = useMemo(() => {
    const imgs = (h?.images || []).filter(Boolean);
    if (imgs.length) return imgs;
    return h?.image ? [h.image] : [];
  }, [h]);

  useEffect(() => {
    setImgIdx(0);
  }, [slug]);

  if (loading || !h) {
    return (
      <div className="sk-container py-24 text-center">
        <Loader className="animate-spin mx-auto text-brand-900" size={36} />
        <div className="mt-4 text-ink-500">Loading hamper…</div>
      </div>
    );
  }

  const price = h.price;
  const mrp = h.mrp || h.price;
  const disc = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const rating = h.rating ?? 4.8;
  const reviews = h.reviews ?? 78;
  const wished = has(h.id);
  const bars = ratingBars(reviews);

  const addToCart = () => {
    add(
      {
        id: h.id,
        name: h.name,
        image: h.image,
        slug: h.slug,
        meta: { message: msg, deliveryDate: date, type: 'hamper' },
      },
      { qty, variant: { w: h.weight, price }, source: 'hamper' },
    );
    setToast('Hamper added to cart');
    setTimeout(() => setToast(''), 2800);
  };

  return (
    <div>
      <div className="sk-container pt-5 md:pt-7 pb-2">
        <Breadcrumb items={[{ label: 'Gift Hampers', to: '/gift-hampers' }, { label: h.name }]} />
      </div>

      {/* Gallery + buy box */}
      <div className="sk-container py-6 md:py-10 grid md:grid-cols-2 gap-8 md:gap-12">
        <div>
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-cream-200 relative group">
            <img src={gallery[imgIdx] || gallery[0]} alt={h.name} className="w-full h-full object-cover" />
            <button
              type="button"
              aria-label="Wishlist"
              onClick={() => toggle(h.id)}
              className={cn(
                'absolute top-4 right-4 h-10 w-10 rounded-full bg-white/95 grid place-items-center shadow-sk-sm z-10',
                wished ? 'text-red-500' : 'text-brand-900',
              )}
            >
              <Heart size={18} fill={wished ? 'currentColor' : 'none'} />
            </button>
            {gallery.length > 1 && (
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => setImgIdx((i) => (i - 1 + gallery.length) % gallery.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 grid place-items-center shadow-sk-sm text-brand-900 opacity-90 hover:opacity-100"
            >
              <ChevronLeft size={18} />
            </button>
            )}
            {gallery.length > 1 && (
            <button
              type="button"
              aria-label="Next image"
              onClick={() => setImgIdx((i) => (i + 1) % gallery.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 grid place-items-center shadow-sk-sm text-brand-900 opacity-90 hover:opacity-100"
            >
              <ChevronRight size={18} />
            </button>
            )}
          </div>
          <div className="hidden md:flex mt-3 gap-2">
            {gallery.map((im, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setImgIdx(i)}
                className={cn(
                  'w-20 h-20 rounded-lg overflow-hidden border-2 shrink-0',
                  i === imgIdx ? 'border-brand-900' : 'border-line hover:border-brand-700',
                )}
              >
                <img src={im} alt={`${h.name} view ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="sk-pill !bg-[#F3D5B5] !text-brand-900 !rounded-md !px-2.5">Bestseller</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-brand-900 mt-3 leading-tight">
            {h.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-ink-600">
            <div className="flex items-center gap-0.5 text-[var(--sk-star)]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} fill={i < Math.round(rating) ? 'currentColor' : 'none'} className="sk-star" />
              ))}
            </div>
            <span className="font-semibold text-brand-900">{Number(rating).toFixed(1)}/5</span>
            <span>({reviews} Reviews)</span>
            <span className="inline-flex items-center gap-1 text-[12px] text-ink-600 ml-1">
              Sold by <b className="text-brand-900 font-semibold">Sukhmal Dry Fruits Korner</b>
              <CheckCircle2 size={14} className="text-[var(--sk-green-500)]" />
            </span>
          </div>

          <div className="mt-5 flex items-end gap-3 flex-wrap">
            <div className="font-display font-bold text-brand-900 text-3xl md:text-[2.25rem] leading-none">
              {inr(price)}
            </div>
            {mrp > price && <div className="text-ink-500 line-through text-lg pb-0.5">{inr(mrp)}</div>}
            {disc > 0 && (
              <span className="text-[var(--sk-gold-400)] font-bold text-sm pb-1">({disc}% OFF)</span>
            )}
          </div>
          <div className="text-[12px] text-ink-500 mt-1.5">Inclusive of all taxes</div>

          <div className="mt-7">
            <div className="text-[13px] font-semibold text-brand-900 mb-2.5">Pack</div>
            <div className="inline-flex px-4 py-2.5 rounded-full border-2 border-brand-900 text-sm font-medium text-brand-900 bg-white shadow-sk-sm">
              {h.tier} · {h.weight}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <div className="inline-flex items-center rounded-lg border border-line-strong overflow-hidden bg-white">
              <button
                type="button"
                aria-label="Decrease"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3.5 py-2.5 hover:bg-cream-200 text-brand-900"
              >
                <Minus size={15} />
              </button>
              <span className="px-4 py-2.5 font-semibold text-brand-900 min-w-[2.5rem] text-center tabular-nums">
                {qty}
              </span>
              <button
                type="button"
                aria-label="Increase"
                onClick={() => setQty((q) => q + 1)}
                className="px-3.5 py-2.5 hover:bg-cream-200 text-brand-900"
              >
                <Plus size={15} />
              </button>
            </div>
            <button
              type="button"
              onClick={addToCart}
              data-testid="hamper-add-cart"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-[10px] bg-[var(--sk-gold-400)] hover:bg-[var(--sk-gold-500)] text-white font-semibold text-[15px] py-3.5 px-6 shadow-sk-sm transition min-w-[10rem]"
            >
              <ShoppingBag size={17} /> Add to Cart
            </button>
            <button
              type="button"
              aria-label="Wishlist"
              onClick={() => toggle(h.id)}
              className={cn(
                'h-[52px] w-[52px] shrink-0 rounded-[10px] border-2 grid place-items-center transition',
                wished
                  ? 'border-red-400 text-red-500 bg-red-50'
                  : 'border-brand-900 text-brand-900 bg-white hover:bg-cream-200',
              )}
            >
              <Heart size={20} fill={wished ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-line pt-5">
            {TRUST_ROW.map(({ Ic, label }) => (
              <div key={label} className="text-center">
                <Ic size={20} className="mx-auto text-gold-400" />
                <div className="text-[11px] font-semibold text-brand-900 mt-1.5 leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What’s Inside · Make it More Special · Product Details */}
      <div className="bg-cream-200/60 border-y border-line">
        <div className="sk-container py-10 md:py-14 grid md:grid-cols-3 gap-8 md:gap-10">
          <section>
            <h2 className="font-display font-bold text-brand-900 text-xl md:text-2xl">What’s Inside</h2>
            <ul className="mt-4 space-y-3">
              {items.map((c) => (
                <li key={c.name} className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full overflow-hidden bg-cream-300 shrink-0 grid place-items-center ring-1 ring-line">
                    {c.image ? (
                      <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <img src={h.image} alt={h.name} className="w-full h-full object-cover opacity-90" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
                    <div className="text-sm font-medium text-brand-900 truncate">{c.name}</div>
                    {c.weight && <div className="text-[12px] text-ink-500 shrink-0">{c.weight}</div>}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-3 border-t border-line text-sm font-semibold text-brand-900">
              Total Weight: <span className="text-ink-600 font-medium">{totalWeightLabel}</span>
            </div>
          </section>

          <section>
            <h2 className="font-display font-bold text-brand-900 text-xl md:text-2xl">Make it More Special</h2>
            <label className="block mt-4 text-sm font-semibold text-brand-900">Add a Personal Message</label>
            <textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value.slice(0, 150))}
              rows={4}
              placeholder="Write your message here..."
              className="sk-input mt-2 resize-none"
            />
            <div className="text-[11px] text-ink-500 mt-1 text-right">{msg.length}/150</div>

            <label className="mt-4 font-semibold text-brand-900 text-sm inline-flex items-center gap-1.5">
              <Calendar size={14} /> Select Delivery Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="sk-input mt-2"
            />

            <div className="mt-5 grid grid-cols-2 gap-3">
              {MID_TRUST.map(({ Ic, label }) => (
                <div key={label} className="flex items-start gap-2 bg-white rounded-lg border border-line p-2.5">
                  <Ic size={16} className="text-gold-400 mt-0.5 shrink-0" />
                  <span className="text-[11px] font-medium text-brand-900 leading-snug">{label}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display font-bold text-brand-900 text-xl md:text-2xl">Product Details</h2>
            <p className="mt-4 text-sm text-ink-600 leading-relaxed">
              {h.description ||
                `A thoughtfully curated ${h.tier.toLowerCase()} dry-fruit hamper from Sukhmal — handpicked ingredients, elegant packaging, and ready to gift for every celebration.`}
            </p>
            <ul className="mt-4 space-y-2.5">
              {DETAIL_BULLETS.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-ink-600">
                  <CheckCircle2 size={16} className="text-gold-400 mt-0.5 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* Reviews */}
      <div className="sk-container py-10 md:py-14">
        <div className="grid md:grid-cols-[220px_1fr] gap-8 md:gap-12 items-start">
          <div>
            <div className="font-display font-bold text-brand-900 text-5xl leading-none">{Number(rating).toFixed(1)}</div>
            <div className="flex items-center gap-0.5 text-[var(--sk-star)] mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} fill={i < Math.round(rating) ? 'currentColor' : 'none'} className="sk-star" />
              ))}
            </div>
            <div className="text-sm text-ink-500 mt-1">Based on {reviews} reviews</div>
          </div>
          <div className="space-y-2">
            {bars.map((b) => (
              <div key={b.star} className="flex items-center gap-3 text-[13px]">
                <span className="w-8 text-ink-600 font-medium">{b.star}★</span>
                <div className="flex-1 h-2 rounded-full bg-cream-300 overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--sk-star)]" style={{ width: `${b.pct}%` }} />
                </div>
                <span className="w-8 text-ink-400 text-right">{b.count}</span>
              </div>
            ))}
          </div>
        </div>

        <article className="mt-8 rounded-xl border border-line bg-white p-5 md:p-6 shadow-sk-sm max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-cream-300 grid place-items-center font-display font-bold text-brand-900">
              NK
            </div>
            <div>
              <div className="font-semibold text-brand-900 text-sm">
                Neha Kapoor{' '}
                <span className="inline-flex items-center gap-1 text-[11px] text-[var(--sk-green-500)] font-medium ml-1">
                  <CheckCircle2 size={12} /> Verified Buyer
                </span>
              </div>
              <div className="flex items-center gap-0.5 text-[var(--sk-star)] mt-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={12} fill="currentColor" className="sk-star" />
                ))}
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm text-ink-600 leading-relaxed">
            Absolutely loved the packaging and freshness. Perfect gift for my sister’s wedding — everyone asked where we ordered from!
          </p>
        </article>
        <Link
          to="/gift-hampers"
          className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-brand-900 hover:text-brand-700"
        >
          View All Reviews →
        </Link>
      </div>

      {/* You May Also Like */}
      <div className="sk-container pb-14 md:pb-20">
        <div className="flex items-end justify-between gap-4 mb-6">
          <h2 className="font-display font-bold text-brand-900 text-2xl md:text-3xl">You May Also Like</h2>
          <Link to="/gift-hampers" className="sk-btn-ghost text-sm hidden sm:inline-flex">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5">
          {allHampers
            .filter((x) => x.id !== h.id)
            .slice(0, 5)
            .map((x) => (
              <PremiumHamperCard key={x.id} h={x} />
            ))}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] bg-brand-900 text-white text-sm font-medium px-5 py-3 rounded-full shadow-sk-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
