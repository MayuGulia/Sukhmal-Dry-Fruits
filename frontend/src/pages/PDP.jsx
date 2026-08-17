import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Star, Heart, ShoppingBag, ShieldCheck, Truck, Package, Leaf,
  MinusIcon, PlusIcon, Loader, Maximize2, X, ChevronLeft, ChevronRight,
  Gift, ChevronDown, CheckCircle2, Brain, HeartPulse, Scale, Sparkles, Droplets,
  Clock, Hand,
} from 'lucide-react';
import { inr } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useProduct, useProducts } from '@/lib/catalog';
import { packVariants } from '@/lib/commerceStore';
import Breadcrumb from '@/components/shared/Breadcrumb';
import ProductCard from '@/components/shared/ProductCard';
import { api } from '@/lib/api';
import { CATEGORIES } from '@/data/mockCatalog';
import { STORE_WHATSAPP } from '@/data/storeInfo';

const TRUST = [
  { Ic: Leaf, l: '100% Natural', s: 'No Preservatives' },
  { Ic: Star, l: 'Premium Quality', s: 'Finest from Around the World' },
  { Ic: Hand, l: 'Handpicked with Care', s: 'Hygienically Packed' },
  { Ic: Truck, l: 'Express Delivery', s: 'Across India' },
  { Ic: Package, l: 'Secure Packaging', s: 'Safe & Fresh Delivery' },
];

const DEFAULT_NUTRITION = [
  { label: 'Energy', value: '579 kcal' },
  { label: 'Protein', value: '21.2 g' },
  { label: 'Carbohydrates', value: '21.6 g' },
  { label: 'Dietary Fiber', value: '12.5 g' },
  { label: 'Total Fat', value: '49.9 g' },
  { label: 'Saturated Fat', value: '3.8 g' },
  { label: 'Monounsaturated Fat', value: '31.6 g' },
  { label: 'Polyunsaturated Fat', value: '12.3 g' },
  { label: 'Cholesterol', value: '0 mg' },
  { label: 'Sodium', value: '1 mg' },
  { label: 'Calcium', value: '269 mg' },
  { label: 'Iron', value: '3.7 mg' },
  { label: 'Potassium', value: '733 mg' },
  { label: 'Vitamin E', value: '25.6 mg' },
];

const DEFAULT_BENEFITS = [
  { Ic: HeartPulse, t: 'Improves Heart Health', d: 'Rich in monounsaturated fats that support healthy cholesterol levels.' },
  { Ic: Brain, t: 'Boosts Brain Function', d: 'Vitamin E and antioxidants help protect cognitive health.' },
  { Ic: Scale, t: 'Aids in Weight Management', d: 'Protein and fiber promote satiety and balanced snacking.' },
  { Ic: Sparkles, t: 'Supports Glowing Skin', d: 'Natural vitamin E nourishes skin from within.' },
  { Ic: Droplets, t: 'Natural Source of Energy', d: 'Wholesome fats and nutrients for sustained vitality.' },
];

const DEFAULT_FAQS = [
  { q: 'Are these organic?', a: '100% natural and pesticide-free. Certified-organic packs are labelled separately when available.' },
  { q: 'What is the best-before period?', a: 'Best within 6 months from the date of packaging when stored as recommended.' },
  { q: 'Do you ship internationally?', a: 'Currently we ship across India only.' },
  { q: 'Can I add a gift message?', a: 'Yes — use Add Gift Message above the delivery checker before adding to cart.' },
];

const SAMPLE_REVIEWS = [
  {
    name: 'Ramesh A.',
    initials: 'RA',
    rating: 5,
    date: '5 days ago',
    text: 'Absolutely the freshest pack I’ve ordered online. Big, plump, and crunchy. Will reorder!',
  },
  {
    name: 'Nikita V.',
    initials: 'NV',
    rating: 5,
    date: '2 weeks ago',
    text: 'Premium quality — packaging was airtight and arrived well before the ETA. Highly recommend.',
  },
  {
    name: 'Priya S.',
    initials: 'PS',
    rating: 4,
    date: '3 weeks ago',
    text: 'Great taste and value. Wish there was a 750g option, but 500g worked perfectly for us.',
  },
];

function Stars({ value = 0, size = 14 }) {
  const n = Math.round(Number(value) || 0);
  return (
    <div className="flex items-center gap-0.5 text-[var(--sk-star)]">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} fill={i < n ? 'currentColor' : 'none'} className="sk-star" strokeWidth={1.75} />
      ))}
    </div>
  );
}

function categoryLabel(slug) {
  return CATEGORIES.find((c) => c.slug === slug)?.name || slug;
}

function ratingBreakdown(total) {
  const t = Math.max(1, Number(total) || 1);
  const weights = [0.72, 0.18, 0.06, 0.03, 0.01];
  return [5, 4, 3, 2, 1].map((star, i) => {
    const count = Math.round(t * weights[i]);
    return { star, count, pct: Math.round((count / t) * 100) };
  });
}

function pickDefaultVariant(variants) {
  if (!variants?.length) return null;
  return variants.find((v) => /500\s*g/i.test(v.w)) || variants[0];
}

/* ─── Gallery: desktop thumbs + zoom; mobile swipe + dots ─── */
function ProductGallery({ images, name, outOfStock }) {
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const trackRef = useRef(null);
  const thumbsRef = useRef(null);

  const go = useCallback((i) => {
    if (!images.length) return;
    const next = ((i % images.length) + images.length) % images.length;
    setIdx(next);
    const track = trackRef.current;
    if (track) {
      const slide = track.children[next];
      if (slide) track.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
    }
  }, [images.length]);

  useEffect(() => { setIdx(0); }, [images.join('|')]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const onScroll = () => {
      const w = track.clientWidth || 1;
      const i = Math.round(track.scrollLeft / w);
      setIdx((prev) => (i !== prev && i >= 0 && i < images.length ? i : prev));
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, [images.length]);

  useEffect(() => {
    if (!lightbox) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight') go(idx + 1);
      if (e.key === 'ArrowLeft') go(idx - 1);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [lightbox, idx, go]);

  const scrollThumbs = (dir) => {
    thumbsRef.current?.scrollBy({ left: dir * 96, behavior: 'smooth' });
  };

  return (
    <div>
      {/* Mobile swipe + dots */}
      <div className="md:hidden relative">
        <div
          ref={trackRef}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth rounded-2xl bg-cream-200 border border-line"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {images.map((src, i) => (
            <div key={src + i} className="relative min-w-full snap-center aspect-square">
              <img src={src} alt={`${name} ${i + 1}`} className="w-full h-full object-contain p-4 bg-cream-200" draggable={false} decoding="async" />
            </div>
          ))}
        </div>
        {outOfStock && (
          <div className="absolute inset-0 bg-black/50 grid place-items-center rounded-2xl">
            <span className="sk-pill bg-red-500 text-white text-base">Out of stock</span>
          </div>
        )}
        <button
          type="button"
          aria-label="Zoom image"
          onClick={() => setLightbox(true)}
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/95 shadow-sk-sm grid place-items-center text-brand-900"
        >
          <Maximize2 size={16} />
        </button>
        {images.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Image ${i + 1}`}
                onClick={() => go(i)}
                className={`h-2 rounded-full transition-all ${i === idx ? 'w-5 bg-brand-900' : 'w-2 bg-line-strong'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop main + thumbs */}
      <div className="hidden md:block">
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-cream-200 border border-line group">
          <img
            src={images[idx]}
            alt={name}
            className="w-full h-full object-contain p-6 cursor-zoom-in transition-transform duration-500 group-hover:scale-[1.02]"
            onClick={() => setLightbox(true)}
            decoding="async"
          />
          {outOfStock && (
            <div className="absolute inset-0 bg-black/50 grid place-items-center">
              <span className="sk-pill bg-red-500 text-white text-base">Out of stock</span>
            </div>
          )}
          <button
            type="button"
            aria-label="Open lightbox"
            onClick={() => setLightbox(true)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/95 shadow-sk-md grid place-items-center text-brand-900 hover:bg-white"
          >
            <Maximize2 size={18} />
          </button>
        </div>

        {images.length > 1 && (
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous thumbnails"
              onClick={() => { scrollThumbs(-1); go(idx - 1); }}
              className="h-9 w-9 shrink-0 rounded-full border border-line-strong bg-white grid place-items-center text-brand-900 hover:border-brand-900"
            >
              <ChevronLeft size={16} />
            </button>
            <div ref={thumbsRef} className="flex gap-2.5 overflow-x-auto flex-1 py-0.5" style={{ scrollbarWidth: 'none' }}>
              {images.map((im, i) => (
                <button
                  key={im + i}
                  type="button"
                  onClick={() => go(i)}
                  className={`w-[72px] h-[72px] rounded-xl overflow-hidden border-2 shrink-0 transition ${
                    i === idx ? 'border-[var(--sk-gold-400)] shadow-sk-sm' : 'border-line hover:border-brand-700'
                  }`}
                >
                  <img src={im} alt={`${name} thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label="Next thumbnails"
              onClick={() => { scrollThumbs(1); go(idx + 1); }}
              className="h-9 w-9 shrink-0 rounded-full border border-line-strong bg-white grid place-items-center text-brand-900 hover:border-brand-900"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Product image zoom"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute top-4 right-4 h-11 w-11 rounded-full bg-white/10 text-white grid place-items-center hover:bg-white/20"
            onClick={() => setLightbox(false)}
          >
            <X size={22} />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                className="absolute left-3 md:left-6 h-11 w-11 rounded-full bg-white/10 text-white grid place-items-center hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); go(idx - 1); }}
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                aria-label="Next image"
                className="absolute right-3 md:right-6 h-11 w-11 rounded-full bg-white/10 text-white grid place-items-center hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); go(idx + 1); }}
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}
          <img
            src={images[idx]}
            alt={name}
            className="max-h-[88vh] max-w-[94vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function NutritionTable({ rows }) {
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="min-w-[280px] border border-line rounded-xl overflow-hidden bg-white">
        <div className="grid grid-cols-2 bg-cream-300 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wider text-brand-900">
          <span>Component</span>
          <span className="text-right">Amount per 100g</span>
        </div>
        {rows.map((r, i) => (
          <div
            key={r.label}
            className={`grid grid-cols-2 gap-3 px-4 py-3 text-sm border-t border-line ${
              i % 2 ? 'bg-cream-100' : 'bg-white'
            }`}
          >
            <span className="text-ink-600">{r.label}</span>
            <span className="text-right font-semibold text-brand-900 whitespace-nowrap">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsBlock({ rating, reviews, productName }) {
  const [ri, setRi] = useState(0);
  const breakdown = ratingBreakdown(reviews);
  const review = SAMPLE_REVIEWS[ri];

  return (
    <div className="grid md:grid-cols-[240px_1fr] gap-8 md:gap-12 items-start">
      <div>
        <div className="font-display text-5xl md:text-6xl font-bold text-brand-900 leading-none">
          {Number(rating).toFixed(1)}
        </div>
        <div className="flex my-2.5">
          <Stars value={rating} size={18} />
        </div>
        <div className="text-[13px] text-ink-500">Based on {reviews} Reviews</div>
        <div className="mt-5 space-y-2">
          {breakdown.map(({ star, count, pct }) => (
            <div key={star} className="flex items-center gap-2 text-[12px]">
              <span className="w-3 text-brand-900 font-medium">{star}</span>
              <Star size={11} className="sk-star fill-current shrink-0" />
              <div className="flex-1 h-2 rounded-full bg-cream-300 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--sk-star)]"
                  style={{ width: `${Math.max(pct, count ? 4 : 0)}%` }}
                />
              </div>
              <span className="w-9 text-right text-ink-500 tabular-nums">{pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="sk-card p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-full bg-cream-300 text-brand-900 font-semibold text-sm grid place-items-center shrink-0">
              {review.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-brand-900">{review.name}</span>
                <span className="sk-pill sk-pill-green !text-[10px] !py-0.5">Verified Buyer</span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                <Stars value={review.rating} size={13} />
                <span className="text-[11px] text-ink-400">{review.date}</span>
              </div>
              <p className="text-sm text-ink-600 mt-3 leading-relaxed">
                {review.text.replace('pack', productName)}
              </p>
            </div>
          </div>
        </div>
        {SAMPLE_REVIEWS.length > 1 && (
          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              aria-label="Previous review"
              onClick={() => setRi((i) => (i - 1 + SAMPLE_REVIEWS.length) % SAMPLE_REVIEWS.length)}
              className="h-9 w-9 rounded-full border border-line-strong bg-white grid place-items-center text-brand-900 hover:border-brand-900"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              aria-label="Next review"
              onClick={() => setRi((i) => (i + 1) % SAMPLE_REVIEWS.length)}
              className="h-9 w-9 rounded-full border border-line-strong bg-white grid place-items-center text-brand-900 hover:border-brand-900"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function RelatedCarousel({ items }) {
  const ref = useRef(null);
  const scroll = (dir) => {
    ref.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Previous products"
        onClick={() => scroll(-1)}
        className="hidden md:grid absolute -left-3 lg:-left-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border border-line-strong bg-white shadow-sk-sm place-items-center text-brand-900 hover:border-brand-900"
      >
        <ChevronLeft size={18} />
      </button>
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {items.map((x) => (
          <div key={x.id} className="snap-start shrink-0 w-[210px] md:w-[220px]">
            <ProductCard p={x} />
          </div>
        ))}
      </div>
      <button
        type="button"
        aria-label="Next products"
        onClick={() => scroll(1)}
        className="hidden md:grid absolute -right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border border-line-strong bg-white shadow-sk-sm place-items-center text-brand-900 hover:border-brand-900"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

export default function PDP() {
  const { slug } = useParams();
  const { data: p, loading } = useProduct(slug);
  const packs = packVariants(p || {});
  const [variantW, setVariantW] = useState(null);
  const [qty, setQty] = useState(1);
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState(null);
  const [checkingPin, setCheckingPin] = useState(false);
  const [tab, setTab] = useState('description');
  const [showMsg, setShowMsg] = useState(false);
  const [msg, setMsg] = useState('');
  const reviewsRef = useRef(null);
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const { data: related = [] } = useProducts({ category: p?.category, limit: 10 });

  useEffect(() => {
    setVariantW(null);
    setQty(1);
    setTab('description');
    setShowMsg(false);
    setMsg('');
    setPincode('');
    setPincodeResult(null);
  }, [slug]);

  useEffect(() => {
    if (!p) return;
    const next = packVariants(p);
    setVariantW((w) => (w && next.some((v) => v.w === w) ? w : (pickDefaultVariant(next)?.w || next[0]?.w || null)));
  }, [p]);

  const checkPincode = async (e) => {
    e.preventDefault();
    if (pincode.length !== 6) {
      setPincodeResult({ ok: false, text: 'Enter a valid 6-digit pincode.' });
      return;
    }
    setCheckingPin(true);
    try {
      const r = await api.get(`/checkout/pincode/${pincode}`);
      setPincodeResult(
        r.data.ok
          ? { ok: true, text: `Delivery available. ${r.data.eta || 'Usually delivered in 2–4 days.'}` }
          : { ok: false, text: r.data.message || 'Delivery not available for this pincode.' }
      );
    } catch {
      setPincodeResult({ ok: true, text: 'Usually delivered in 2–4 days.' });
    } finally {
      setCheckingPin(false);
    }
  };

  const relatedItems = useMemo(
    () => (related || []).filter((x) => x.id !== p?.id).slice(0, 8),
    [related, p?.id]
  );

  const tabs = useMemo(() => {
    const count = p?.reviews || 0;
    return [
      { id: 'description', label: 'Description' },
      { id: 'nutrition', label: 'Nutritional Info' },
      { id: 'ingredients', label: 'Ingredients' },
      { id: 'benefits', label: 'Benefits' },
      { id: 'storage', label: 'Storage Instructions' },
      { id: 'reviews', label: `Reviews (${count})` },
      { id: 'faqs', label: 'FAQs' },
    ];
  }, [p?.reviews]);

  if (!p) {
    if (loading) {
      return (
        <div className="sk-container py-24 text-center">
          <Loader className="animate-spin mx-auto text-brand-900" size={36} />
          <div className="mt-4 text-ink-500">Loading product…</div>
        </div>
      );
    }
    return (
      <div className="sk-container py-24 text-center">
        <div className="font-display text-2xl font-bold text-brand-900">Product not found</div>
        <p className="text-ink-500 mt-2">This item may have been removed from the catalog.</p>
      </div>
    );
  }

  const activeVariant = packs.find((v) => v.w === variantW) || packs[0] || { w: '250g', price: p.price };
  const variantOos = typeof activeVariant.stock === 'number' ? activeVariant.stock <= 0 : p.stock === 0;
  const disc = p.mrp && p.mrp > activeVariant.price
    ? Math.round(((p.mrp - activeVariant.price) / p.mrp) * 100)
    : 0;
  const images = p.images?.length ? p.images : ['https://loremflickr.com/800/800/nuts?lock=1'];
  const catName = categoryLabel(p.category);
  const highlights = p.highlights?.length
    ? p.highlights
    : [
        'Premium hand-picked grade',
        'Naturally processed — no artificial additives',
        'Hygienically packed in our HACCP-certified facility',
        'Ideal for daily snacking, cooking & gifting',
      ];
  const nutrition = p.nutrition?.length ? p.nutrition : DEFAULT_NUTRITION;
  const benefits = p.benefits?.length ? p.benefits : DEFAULT_BENEFITS;
  const faqs = p.faqs?.length ? p.faqs : DEFAULT_FAQS;
  const waText = encodeURIComponent(`Hi Sukhmal, I’d like to order ${p.name} (${activeVariant.w})`);
  const saved = has(p.id);

  const selectTab = (id) => {
    setTab(id);
    if (id === 'reviews') {
      requestAnimationFrame(() => {
        reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  return (
    <div className="sk-fade-up bg-[var(--sk-cream-100)]">
      {/* Breadcrumb */}
      <div className="sk-container pt-5 md:pt-7 pb-2">
        <Breadcrumb
          items={[
            { label: catName, to: `/category/${p.category}` },
            ...(p.subcategory ? [{ label: p.subcategory }] : []),
            { label: p.name },
          ]}
        />
      </div>

      {/* Hero: gallery + buy box */}
      <div className="sk-container py-6 md:py-10 grid lg:grid-cols-2 gap-8 lg:gap-14">
        <ProductGallery
          images={images}
          name={p.name}
          outOfStock={variantOos}
        />

        <div className="flex flex-col">
          {p.bestseller && (
            <span className="sk-pill !bg-[var(--sk-cream-300)] !text-brand-900 !rounded-md !px-2.5 w-fit">
              Bestseller
            </span>
          )}

          <h1 className="font-display text-[1.75rem] md:text-[2.35rem] font-bold text-brand-900 mt-3 leading-tight">
            {p.name}
          </h1>

          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[13px] text-ink-600">
            <Stars value={p.rating} size={15} />
            <span className="font-semibold text-brand-900">{Number(p.rating).toFixed(1)}/5</span>
            <span>({p.reviews} Reviews)</span>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[13px] text-ink-600">
            <span>Sold by</span>
            <span className="font-semibold text-brand-900">Sukhmal Dry Fruits Korner</span>
            <span className="inline-flex items-center gap-1 text-[var(--sk-green-500)] font-medium">
              <CheckCircle2 size={15} className="fill-[var(--sk-green-100)]" /> Verified
            </span>
          </div>

          <div className="mt-6 flex items-end gap-3 flex-wrap">
            <div className="font-display font-bold text-brand-900 text-[2rem] md:text-[2.25rem] leading-none">
              {inr(activeVariant.price)}
            </div>
            {p.mrp > activeVariant.price && (
              <div className="text-ink-500 line-through text-lg pb-0.5">{inr(p.mrp)}</div>
            )}
            {disc > 0 && (
              <span className="text-[var(--sk-brown-600)] font-bold text-sm pb-1">({disc}% OFF)</span>
            )}
          </div>
          <div className="text-[12px] text-ink-500 mt-1.5">Inclusive of all taxes</div>

          {/* Weight chips */}
          <div className="mt-7">
            <div className="text-[13px] font-semibold text-brand-900 mb-2.5">Select Weight</div>
            <div className="flex flex-wrap gap-2">
              {packs.map((v) => {
                const on = activeVariant.w === v.w;
                return (
                  <button
                    key={v.w}
                    type="button"
                    onClick={() => setVariantW(v.w)}
                    data-testid={`pdp-variant-${v.w}`}
                    className={`min-w-[4.5rem] px-3.5 py-2.5 rounded-lg border-2 text-sm font-medium transition ${
                      on
                        ? 'border-brand-900 text-brand-900 bg-white shadow-sk-sm'
                        : 'border-line-strong text-ink-600 bg-white hover:border-brand-700'
                    }`}
                  >
                    {v.w}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity */}
          <div className="mt-6">
            <div className="text-[13px] font-semibold text-brand-900 mb-2.5">Quantity</div>
            <div className="inline-flex items-center rounded-lg border border-line-strong overflow-hidden bg-white">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3.5 py-2.5 hover:bg-cream-200 text-brand-900"
              >
                <MinusIcon size={15} />
              </button>
              <span className="px-4 py-2.5 font-semibold text-brand-900 min-w-[2.5rem] text-center tabular-nums">{qty}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQty((q) => q + 1)}
                className="px-3.5 py-2.5 hover:bg-cream-200 text-brand-900"
              >
                <PlusIcon size={15} />
              </button>
            </div>
          </div>

          {/* ATC + Wishlist */}
          <div className="mt-6 flex items-stretch gap-3">
            <button
              type="button"
              onClick={() => add(p, { qty, variant: activeVariant, giftMessage: msg || undefined })}
              disabled={variantOos}
              data-testid="pdp-add-cart"
              className="sk-btn-primary flex-1 !rounded-[10px] !py-3.5 !text-[15px] gap-2 disabled:opacity-50"
            >
              <ShoppingBag size={17} />
              {variantOos ? 'Notify Me' : 'Add to Cart'}
            </button>
            <button
              type="button"
              aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
              onClick={() => toggle(p.id)}
              className={`h-[52px] w-[52px] shrink-0 rounded-[10px] border-2 grid place-items-center transition ${
                saved
                  ? 'border-red-400 text-red-500 bg-red-50'
                  : 'border-brand-900 text-brand-900 bg-white hover:bg-cream-200'
              }`}
            >
              <Heart size={20} fill={saved ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Gift message */}
          <div className="mt-5 border border-line rounded-xl bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setShowMsg((s) => !s)}
              className="w-full flex items-center gap-2.5 px-4 py-3.5 text-left hover:bg-cream-100"
            >
              <Gift size={16} className="text-brand-700 shrink-0" />
              <span className="flex-1 text-sm text-brand-900">
                <span className="font-semibold">Add Gift Message:</span>{' '}
                <span className="font-normal text-ink-600">Make it special with a personalised message.</span>
              </span>
              <ChevronDown size={16} className={`text-ink-500 shrink-0 transition ${showMsg ? 'rotate-180' : ''}`} />
            </button>
            {showMsg && (
              <div className="px-4 pb-4 border-t border-line">
                <textarea
                  value={msg}
                  onChange={(e) => setMsg(e.target.value.slice(0, 150))}
                  rows={3}
                  placeholder="Write a short gift note…"
                  className="sk-input mt-3 resize-none"
                />
                <div className="text-[11px] text-ink-500 mt-1.5 text-right">{msg.length}/150</div>
              </div>
            )}
          </div>

          {/* Pincode */}
          <div className="mt-5">
            <div className="font-semibold text-brand-900 text-sm mb-2.5">Check Delivery</div>
            <form onSubmit={checkPincode} className="flex gap-2">
              <input
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter Pincode"
                inputMode="numeric"
                className="sk-input !py-2.5 flex-1"
                aria-label="Pincode"
              />
              <button type="submit" disabled={checkingPin} className="sk-btn-primary !py-2.5 !px-5 shrink-0 !rounded-lg">
                {checkingPin ? '…' : 'Check'}
              </button>
            </form>
            {pincodeResult ? (
              <div className={`mt-2.5 text-[13px] ${pincodeResult.ok ? 'text-[var(--sk-green-500)]' : 'text-[var(--sk-red-500)]'}`}>
                {pincodeResult.text}
              </div>
            ) : (
              <div className="mt-2.5 flex items-center gap-1.5 text-[12px] text-ink-500">
                <Clock size={13} className="shrink-0" />
                Usually delivered in 2–4 days
              </div>
            )}
          </div>

          {/* WhatsApp CTA */}
          <a
            href={`https://wa.me/${STORE_WHATSAPP}?text=${waText}`}
            target="_blank"
            rel="noreferrer"
            className="mt-5 w-full inline-flex items-center justify-center gap-3 rounded-[12px] bg-[#25D366] hover:bg-[#1fb855] text-white font-semibold text-base py-4 px-5 shadow-sk-md transition"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span className="flex flex-col items-start leading-tight">
              <span>Quick Order on WhatsApp</span>
              <span className="text-[11px] font-normal text-white/90">Get instant help &amp; order</span>
            </span>
          </a>
        </div>
      </div>

      {/* Trust row */}
      <div className="border-y border-line bg-white">
        <div className="sk-container py-6 md:py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5 md:gap-4">
            {TRUST.map(({ Ic, l, s }) => (
              <div key={l} className="flex flex-col items-center gap-2 text-center px-1">
                <div className="h-12 w-12 rounded-full border border-brand-900/25 grid place-items-center text-brand-900">
                  <Ic size={20} strokeWidth={1.6} />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-brand-900 leading-snug">{l}</div>
                  <div className="text-[11px] text-ink-500 mt-0.5 leading-snug">{s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sk-container py-8 md:py-12">
        <div className="border-b border-line overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="flex gap-0 min-w-max">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTab(t.id)}
                className={`px-4 md:px-5 py-3.5 text-[13px] md:text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition ${
                  tab === t.id
                    ? 'text-brand-900 border-brand-900'
                    : 'text-ink-500 border-transparent hover:text-brand-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="py-7 md:py-9 text-ink-600 leading-relaxed">
          {tab === 'description' && (
            <div className="grid md:grid-cols-[1.25fr_0.75fr] gap-8 items-start max-w-5xl">
              <div>
                <p className="whitespace-pre-line text-[15px]">
                  {p.description ||
                    `Our ${p.name} are carefully hand-picked and cleaned in our HACCP-certified facility. Enjoy them as a wholesome snack, in desserts, or as part of a thoughtful gift.`}
                </p>
                <ul className="mt-5 space-y-2.5">
                  {highlights.map((h) => (
                    <li key={h} className="flex gap-2.5 text-[15px]">
                      <CheckCircle2 size={18} className="text-[var(--sk-green-500)] shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="hidden md:block rounded-2xl overflow-hidden aspect-square bg-cream-200 border border-line">
                <img src={images[0]} alt={`${p.name} pack`} className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          {tab === 'nutrition' && (
            <div className="max-w-xl">
              <h3 className="font-display text-xl font-bold text-brand-900 mb-4">Nutritional Information (Per 100g)</h3>
              <NutritionTable rows={nutrition} />
              <p className="text-[12px] text-ink-500 mt-3">Values are approximate and may vary by batch.</p>
            </div>
          )}

          {tab === 'ingredients' && (
            <div className="max-w-3xl">
              <p className="text-[15px] text-brand-900 font-medium">
                {p.ingredients || `100% Natural ${p.name}`}
              </p>
              <div className="mt-6 flex flex-wrap gap-6 md:gap-10">
                {['No Artificial Colour', 'No Preservatives', 'No Added Flavours'].map((t) => (
                  <div key={t} className="flex flex-col items-center gap-2 text-center w-[110px]">
                    <div className="h-16 w-16 rounded-full border-2 border-brand-900/20 grid place-items-center text-brand-900 bg-cream-200">
                      <ShieldCheck size={26} />
                    </div>
                    <span className="text-[12px] font-medium text-ink-600 leading-snug">{t}</span>
                  </div>
                ))}
              </div>
              {(p.allergen_info || p.allergen) && (
                <p className="mt-6 text-sm text-ink-500 border-t border-line pt-4">
                  Allergen info: {p.allergen_info || p.allergen}
                </p>
              )}
            </div>
          )}

          {tab === 'benefits' && (
            <ul className="space-y-4 max-w-2xl">
              {benefits.map((b) => {
                const Ic = b.Ic || Sparkles;
                return (
                  <li key={b.t} className="flex gap-3.5">
                    <div className="h-10 w-10 rounded-full border border-brand-900/20 bg-cream-200 grid place-items-center text-brand-900 shrink-0">
                      <Ic size={18} />
                    </div>
                    <div>
                      <div className="font-semibold text-brand-900">{b.t}</div>
                      {b.d && <p className="text-sm text-ink-600 mt-0.5">{b.d}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {tab === 'storage' && (
            <div className="rounded-xl border border-line bg-cream-200/50 p-5 md:p-6 flex gap-4 max-w-2xl">
              <div className="h-12 w-12 rounded-xl bg-white border border-line grid place-items-center text-brand-900 shrink-0">
                <Package size={22} />
              </div>
              <div>
                <div className="font-semibold text-brand-900 mb-1">Storage Instructions</div>
                <p className="text-[15px] whitespace-pre-line">
                  {p.storage ||
                    'Store in a cool, dry place away from direct sunlight. Keep the pack tightly sealed after opening, or transfer to an airtight container. Refrigerate in humid climates to retain freshness longer.'}
                </p>
              </div>
            </div>
          )}

          {tab === 'reviews' && (
            <ReviewsBlock rating={p.rating} reviews={p.reviews} productName={p.name} />
          )}

          {tab === 'faqs' && (
            <div className="space-y-3 max-w-2xl">
              {faqs.map((f) => (
                <details key={f.q} className="sk-card group p-0 open:shadow-sk-md">
                  <summary className="list-none cursor-pointer px-5 py-4 font-semibold text-brand-900 flex items-center justify-between gap-3">
                    {f.q}
                    <ChevronDown size={16} className="text-ink-500 shrink-0 transition group-open:rotate-180" />
                  </summary>
                  <div className="px-5 pb-4 text-sm text-ink-600 border-t border-line pt-3">{f.a}</div>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reviews section (as in JPEG) */}
      {tab !== 'reviews' && (
        <div ref={reviewsRef} className="bg-white border-y border-line">
          <div className="sk-container py-10 md:py-14">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-brand-900 mb-8">Customer Reviews</h2>
            <ReviewsBlock rating={p.rating} reviews={p.reviews} productName={p.name} />
          </div>
        </div>
      )}
      {tab === 'reviews' && <div ref={reviewsRef} />}

      {/* You May Also Like */}
      {relatedItems.length > 0 && (
        <div className="sk-container py-12 md:py-16">
          <div className="flex items-center gap-4 mb-8 md:mb-10">
            <div className="flex-1 h-px bg-line-strong" />
            <h2 className="font-display text-2xl md:text-3xl font-bold text-brand-900 whitespace-nowrap">
              You May Also Like
            </h2>
            <div className="flex-1 h-px bg-line-strong" />
          </div>
          <RelatedCarousel items={relatedItems} />
        </div>
      )}
    </div>
  );
}
