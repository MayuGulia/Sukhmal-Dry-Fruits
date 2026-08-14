import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award, ChevronDown, Filter, Gift, Heart, Leaf, Minus, Plus, Star, Truck, Users, X,
} from 'lucide-react';
import { useHampers, HamperSkeleton } from '@/lib/catalog';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { inr, cn } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';

const PRICE_FLOOR = 299;
const PRICE_CEIL = 5000;

const OCCASIONS = ['All Hampers', 'Birthday', 'Wedding', 'Corporate', 'Festival', 'Luxury'];

const PRICE_CHIPS = [
  { l: 'Under ₹500', max: 499 },
  { l: '₹500 – ₹1,000', min: 500, max: 1000 },
  { l: '₹1,000 – ₹2,000', min: 1000, max: 2000 },
  { l: '₹2,000 – ₹3,000', min: 2000, max: 3000 },
  { l: '₹3,000 – ₹5,000', min: 3000, max: 5000 },
  { l: 'Above ₹5,000', min: 5001 },
];

const WEIGHTS = ['500g', '1kg', '2kg', '3kg+'];
const QUALITIES = ['Premium', 'Deluxe', 'Luxury'];

const SIDEBAR_CATS = [
  { label: 'Birthday', key: 'Birthday', count: 24 },
  { label: 'Wedding', key: 'Wedding', count: 18 },
  { label: 'Corporate', key: 'Corporate', count: 30 },
  { label: 'Festival', key: 'Festival', count: 28 },
  { label: 'Luxury', key: 'Luxury', count: 16 },
];

const TRUST = [
  { Ic: Award, label: 'Premium Quality', sub: 'Finest Selection' },
  { Ic: Leaf, label: 'Handpicked', sub: 'With Care' },
  { Ic: Gift, label: 'Elegant Packaging', sub: 'Perfect for Gifting' },
  { Ic: Truck, label: 'Express Delivery', sub: 'Across India' },
];

function hamperMeta(h) {
  const seed = String(h.id || h.slug || '').length;
  return {
    rating: h.rating ?? 4.6 + (seed % 4) * 0.1,
    reviews: h.reviews ?? 48 + seed * 17,
  };
}

function weightBucket(weightStr = '') {
  const s = weightStr.toLowerCase().replace(/\s/g, '');
  const kg = s.includes('kg') ? parseFloat(s) : NaN;
  const g = s.includes('g') && !s.includes('kg') ? parseFloat(s) : NaN;
  const grams = !Number.isNaN(kg) ? kg * 1000 : !Number.isNaN(g) ? g : 0;
  if (grams <= 500) return '500g';
  if (grams <= 1000) return '1kg';
  if (grams <= 2000) return '2kg';
  return '3kg+';
}

function FilterSection({ id, title, Icon, open, onToggle, children }) {
  return (
    <div className="border-b border-line last:border-b-0 pb-5 mb-5 last:pb-0 last:mb-0">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center gap-2.5 mb-3"
        aria-expanded={open}
      >
        <Icon size={16} className="text-[var(--sk-gold-500)] shrink-0" strokeWidth={1.75} />
        <span className="flex-1 text-left font-semibold text-brand-900 text-[15px]">{title}</span>
        {open ? (
          <Minus size={16} className="text-[var(--sk-gold-500)] shrink-0" strokeWidth={2.25} />
        ) : (
          <Plus size={16} className="text-[var(--sk-gold-500)] shrink-0" strokeWidth={2.25} />
        )}
      </button>
      {open && children}
    </div>
  );
}

function DualBudgetSlider({ min, max, onChange }) {
  const clampMin = (v) => Math.min(Math.max(PRICE_FLOOR, v), max - 50);
  const clampMax = (v) => Math.max(Math.min(PRICE_CEIL, v), min + 50);
  const thumb =
    'absolute w-full appearance-none bg-transparent pointer-events-none ' +
    '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none ' +
    '[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full ' +
    '[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 ' +
    '[&::-webkit-slider-thumb]:border-[var(--sk-star)] [&::-webkit-slider-thumb]:shadow-sk-sm ' +
    '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 ' +
    '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 ' +
    '[&::-moz-range-thumb]:border-[var(--sk-star)]';

  return (
    <div className="pt-1 px-0.5">
      <div className="relative h-8 flex items-center">
        <div className="absolute left-0 right-0 h-1 rounded-full bg-cream-400" />
        <div
          className="absolute h-1 rounded-full bg-[var(--sk-star)]"
          style={{
            left: `${((min - PRICE_FLOOR) / (PRICE_CEIL - PRICE_FLOOR)) * 100}%`,
            right: `${100 - ((max - PRICE_FLOOR) / (PRICE_CEIL - PRICE_FLOOR)) * 100}%`,
          }}
        />
        <input
          type="range"
          min={PRICE_FLOOR}
          max={PRICE_CEIL}
          step={50}
          value={min}
          aria-label="Minimum budget"
          onChange={(e) => onChange({ min: clampMin(Number(e.target.value)), max })}
          className={thumb}
        />
        <input
          type="range"
          min={PRICE_FLOOR}
          max={PRICE_CEIL}
          step={50}
          value={max}
          aria-label="Maximum budget"
          onChange={(e) => onChange({ min, max: clampMax(Number(e.target.value)) })}
          className={thumb}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-ink-500 font-medium">
        <span>₹299</span>
        <span>₹5,000+</span>
      </div>
    </div>
  );
}

/** Card chrome from design 09 — square photo, heart, serif title, stars, Onwards, circular + */
export function PremiumHamperCard({ h }) {
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const active = has(h.id);
  const { rating, reviews } = hamperMeta(h);

  return (
    <article
      data-testid={`hamper-card-${h.slug}`}
      className="group bg-white border border-line rounded-xl overflow-hidden shadow-sk-sm hover:shadow-sk-md transition-shadow flex flex-col"
    >
      <div className="relative aspect-square overflow-hidden bg-cream-200">
        <Link to={`/gift-hampers/${h.slug}`} className="block h-full">
          <img
            src={h.image}
            alt={h.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </Link>
        <button
          type="button"
          aria-label="Wishlist"
          onClick={() => toggle(h.id)}
          className={cn(
            'absolute top-3 right-3 h-9 w-9 rounded-full bg-white/95 grid place-items-center shadow-sk-sm',
            active ? 'text-red-500' : 'text-brand-900',
          )}
        >
          <Heart size={16} fill={active ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="p-3.5 md:p-4 flex flex-col flex-1">
        <Link
          to={`/gift-hampers/${h.slug}`}
          className="font-display font-bold text-brand-900 text-[15px] md:text-[17px] leading-tight line-clamp-2 hover:text-brand-700"
        >
          {h.name}
        </Link>
        <div className="text-[12px] text-ink-500 mt-1">
          {h.tier} {h.weight}
        </div>
        <div className="flex items-center gap-1 mt-1.5 text-[12px] text-ink-600">
          <div className="flex items-center gap-0.5 text-[var(--sk-star)]">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={12} fill={i < Math.round(rating) ? 'currentColor' : 'none'} className="sk-star" />
            ))}
          </div>
          <span>({reviews})</span>
        </div>
        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <div className="font-display font-bold text-brand-900 text-lg md:text-xl leading-none">
            {inr(h.price)}{' '}
            <span className="text-[12px] font-sans font-medium text-ink-500">Onwards</span>
          </div>
          <button
            type="button"
            aria-label="Add to cart"
            data-testid={`add-hamper-${h.slug}`}
            onClick={() =>
              add(
                { id: h.id, name: h.name, image: h.image, slug: h.slug, meta: { type: 'hamper' } },
                { qty: 1, variant: { w: h.weight, price: h.price }, source: 'hamper' },
              )
            }
            className="h-9 w-9 rounded-full bg-brand-900 text-white grid place-items-center hover:bg-brand-700 shrink-0 shadow-sk-sm"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function GiftHampers() {
  const [chip, setChip] = useState('All Hampers');
  const [budget, setBudget] = useState(null);
  const [sort, setSort] = useState('popularity');
  const [sideCats, setSideCats] = useState([]);
  const [sideWeights, setSideWeights] = useState([]);
  const [sideQuality, setSideQuality] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: PRICE_FLOOR, max: PRICE_CEIL });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [open, setOpen] = useState({
    categories: true,
    budget: true,
    weight: true,
    quality: true,
  });
  const { data: hampers, loading } = useHampers();

  const list = useMemo(() => {
    let rows = hampers.filter((h) => {
      const occasion = chip === 'All Hampers' ? null : chip;
      if (occasion === 'Luxury') {
        if (h.tier !== 'Luxury' && !(h.tags || []).includes('Luxury')) return false;
      } else if (occasion && !(h.tags || []).includes(occasion) && h.tier !== occasion) {
        return false;
      }

      if (budget) {
        if (budget.min && h.price < budget.min) return false;
        if (budget.max && h.price > budget.max) return false;
      } else if (h.price < priceRange.min || (priceRange.max < PRICE_CEIL && h.price > priceRange.max)) {
        return false;
      }

      if (sideCats.length) {
        const ok = sideCats.some((c) =>
          c === 'Luxury' ? h.tier === 'Luxury' || (h.tags || []).includes('Luxury') : (h.tags || []).includes(c),
        );
        if (!ok) return false;
      }
      if (sideWeights.length && !sideWeights.includes(weightBucket(h.weight))) return false;
      if (sideQuality.length && !sideQuality.includes(h.tier)) return false;
      return true;
    });

    rows = [...rows];
    if (sort === 'price-asc') rows.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') rows.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') rows.sort((a, b) => hamperMeta(b).rating - hamperMeta(a).rating);
    return rows;
  }, [hampers, chip, budget, sort, sideCats, sideWeights, sideQuality, priceRange]);

  const toggleArr = (cur, v, set) => set(cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
  const toggleSection = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  const resetAll = () => {
    setChip('All Hampers');
    setBudget(null);
    setSideCats([]);
    setSideWeights([]);
    setSideQuality([]);
    setPriceRange({ min: PRICE_FLOOR, max: PRICE_CEIL });
  };

  const Filters = () => (
    <aside>
      <FilterSection
        id="categories"
        title="Categories"
        Icon={Users}
        open={open.categories}
        onToggle={toggleSection}
      >
        <ul className="space-y-2">
          {SIDEBAR_CATS.map((c) => (
            <li key={c.key}>
              <label className="flex items-center gap-2.5 text-[13px] text-ink-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded-[3px] accent-[var(--sk-brown-900)]"
                  checked={sideCats.includes(c.key)}
                  onChange={() => toggleArr(sideCats, c.key, setSideCats)}
                />
                <span className="flex-1">{c.label} Hampers</span>
                <span className="text-[11px] text-ink-400">({c.count})</span>
              </label>
            </li>
          ))}
        </ul>
      </FilterSection>

      <FilterSection
        id="budget"
        title="Budget Range"
        Icon={Gift}
        open={open.budget}
        onToggle={toggleSection}
      >
        <DualBudgetSlider min={priceRange.min} max={priceRange.max} onChange={setPriceRange} />
      </FilterSection>

      <FilterSection
        id="weight"
        title="Weight"
        Icon={Filter}
        open={open.weight}
        onToggle={toggleSection}
      >
        <div className="flex flex-wrap gap-2">
          {WEIGHTS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => toggleArr(sideWeights, w, setSideWeights)}
              className={cn(
                'min-w-[3.5rem] px-3 py-1.5 rounded-md text-[12px] font-medium border transition-colors',
                sideWeights.includes(w)
                  ? 'bg-[rgba(197,160,89,0.14)] text-brand-900 border-[var(--sk-gold-500)]'
                  : 'bg-white text-brand-900 border-line-strong hover:border-[var(--sk-gold-500)]',
              )}
            >
              {w}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection
        id="quality"
        title="Quality"
        Icon={Award}
        open={open.quality}
        onToggle={toggleSection}
      >
        {QUALITIES.map((q) => (
          <label key={q} className="flex items-center gap-2.5 text-[13px] mb-2 text-ink-600 cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-4 w-4 rounded-[3px] accent-[var(--sk-brown-900)]"
              checked={sideQuality.includes(q)}
              onChange={() => toggleArr(sideQuality, q, setSideQuality)}
            />
            {q}
          </label>
        ))}
      </FilterSection>

      <div className="rounded-xl border border-[var(--sk-gold-500)] bg-[rgba(197,160,89,0.12)] p-3.5 mt-1">
        <div className="flex items-start gap-3">
          <Gift size={28} className="text-[var(--sk-gold-500)] shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <div className="font-semibold text-brand-900 text-[13px] leading-snug">
              Looking for Corporate Gifting?
            </div>
            <p className="text-[12px] text-ink-600 mt-1 leading-relaxed">
              Bulk orders with custom packaging & branding.
            </p>
            <Link
              to="/corporate-gifts"
              className="inline-flex items-center gap-1 mt-2 text-[13px] font-semibold text-[var(--sk-gold-500)] hover:text-[var(--sk-star)]"
            >
              Contact Us →
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="bg-cream-100">
      <div className="bg-cream-200 border-b border-line">
        <div className="sk-container py-8 md:py-10">
          <Breadcrumb items={[{ label: 'Gift Hampers' }]} />
          <h1 className="font-display font-bold text-brand-900 text-3xl md:text-5xl mt-3 leading-tight">
            Gift Hampers
          </h1>
          <p className="text-ink-600 mt-2 max-w-2xl text-sm md:text-base">
            Thoughtfully curated hampers for every occasion — made with premium dry fruits, nuts & more.
          </p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {TRUST.map(({ Ic, label, sub }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 bg-cream-100 border border-line rounded-lg px-3 py-2.5"
              >
                <div className="h-9 w-9 rounded-full bg-white text-[var(--sk-gold-500)] grid place-items-center shrink-0 border border-line">
                  <Ic size={18} strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] md:text-sm font-semibold text-brand-900 leading-tight">{label}</div>
                  <div className="text-[10px] md:text-[11px] text-ink-500">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sk-container py-8 md:py-12">
        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          <div className="hidden lg:block">
            <div className="font-display font-bold text-brand-900 text-lg mb-4 inline-flex items-center gap-2">
              <Filter size={18} className="text-[var(--sk-gold-500)]" /> Filter Hampers
            </div>
            <Filters />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {OCCASIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setChip(c)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium border transition',
                    chip === c
                      ? 'bg-brand-900 text-white border-brand-900'
                      : 'bg-white text-brand-900 border-line-strong hover:border-brand-900',
                  )}
                >
                  {c}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="lg:hidden sk-btn-outline !py-2 !px-3 text-sm"
                >
                  <Filter size={14} /> Filter
                </button>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-[13px] text-ink-600 whitespace-nowrap">Sort by:</span>
                  <div className="relative">
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      data-testid="hamper-sort"
                      className="appearance-none bg-white border border-line-strong rounded-lg pl-3 pr-8 py-2 text-[13px] text-brand-900 font-medium cursor-pointer min-w-[8.5rem] focus:outline-none focus:border-brand-900"
                    >
                      <option value="popularity">Popularity</option>
                      <option value="price-asc">Price Low → High</option>
                      <option value="price-desc">Price High → Low</option>
                      <option value="rating">Rating</option>
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-ink-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {PRICE_CHIPS.map((b) => (
                <button
                  key={b.l}
                  type="button"
                  onClick={() => setBudget(budget?.l === b.l ? null : b)}
                  className={cn(
                    'px-3.5 py-2 rounded-md text-[12px] font-medium border transition',
                    budget?.l === b.l
                      ? 'bg-brand-900 text-white border-brand-900'
                      : 'bg-white text-brand-900 border-line-strong hover:border-brand-900',
                  )}
                >
                  {b.l}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <HamperSkeleton key={i} />)
                : list.map((h) => <PremiumHamperCard key={h.id} h={h} />)}
            </div>

            {!loading && list.length === 0 && (
              <div className="text-center py-16 text-ink-500">
                No hampers match your filters.{' '}
                <button type="button" className="text-brand-900 font-semibold underline" onClick={resetAll}>
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Close filters"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative bg-white rounded-t-3xl p-5 max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="font-display font-bold text-brand-900 text-lg inline-flex items-center gap-2">
                <Filter size={18} /> Filter Hampers
              </div>
              <button type="button" aria-label="Close filters" onClick={() => setMobileOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <Filters />
            <button type="button" onClick={() => setMobileOpen(false)} className="sk-btn-primary w-full mt-5">
              Show {list.length} Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
