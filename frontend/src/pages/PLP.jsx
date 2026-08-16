import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Filter,
  ChevronDown,
  X,
  Gift,
  Nut,
  Apple,
  Leaf,
  Cherry,
  Grape,
  Package,
  Minus,
  Plus,
  Users,
  ShoppingBag,
  Percent,
  HeartHandshake,
  Briefcase,
} from 'lucide-react';
import ProductCard from '@/components/shared/ProductCard';
import { useProducts, useCategories, ProductSkeleton } from '@/lib/catalog';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 12;
const PRICE_FLOOR = 100;
const PRICE_CEIL = 5000;

const WEIGHTS = ['250g', '500g', '1kg', '2kg', '5kg+'];

const SPECIALTIES = [
  {
    id: 'natural',
    label: '100% Natural',
    match: (p) =>
      !!p.natural ||
      (p.specialties || []).some((s) => /natural/i.test(s)) ||
      /natural/i.test(p.tagline || ''),
  },
  {
    id: 'premium',
    label: 'Premium Quality',
    match: (p) =>
      !!p.premium ||
      !!p.bestseller ||
      (p.specialties || []).some((s) => /premium/i.test(s)) ||
      /premium/i.test(`${p.tagline || ''} ${p.name || ''}`),
  },
  {
    id: 'nopreservatives',
    label: 'No Preservatives',
    match: (p) =>
      !!p.noPreservatives ||
      !!p.natural ||
      (p.specialties || []).some((s) => /preservative/i.test(s)),
  },
  {
    id: 'handpicked',
    label: 'Handpicked with Care',
    match: (p) =>
      p.handpicked === true ||
      !!p.bestseller ||
      (p.reviews || 0) >= 400 ||
      (p.specialties || []).some((s) => /handpicked/i.test(s)),
  },
];

const CAT_ICONS = {
  'dry-fruits': Apple,
  nuts: Nut,
  seeds: Leaf,
  dates: Cherry,
  berries: Grape,
  'gift-hampers': Package,
  'wedding-gifts': HeartHandshake,
  'corporate-gifts': Briefcase,
  offers: Percent,
};

const EXTRA_CATS = [
  { slug: 'wedding-gifts', name: 'Wedding Gifts', to: '/wedding-gifts', count: 15 },
  { slug: 'corporate-gifts', name: 'Corporate Gifts', to: '/corporate-gifts', count: 20 },
  { slug: 'offers', name: 'Offers', to: '/offers', count: 10 },
];

function parseWeightGrams(label = '') {
  const s = String(label).toLowerCase().replace(/\s/g, '');
  if (s.includes('5kg')) return 5000;
  const kg = s.match(/^([\d.]+)kg/);
  if (kg) return Math.round(parseFloat(kg[1]) * 1000);
  const g = s.match(/^([\d.]+)g/);
  if (g) return Math.round(parseFloat(g[1]));
  return 0;
}

function productHasWeight(p, chip) {
  const variants = p.variants?.length ? p.variants : [{ w: p.weight }];
  if (chip === '5kg+') {
    return variants.some((v) => parseWeightGrams(v.w) >= 5000);
  }
  return variants.some((v) => {
    const w = String(v.w || '').toLowerCase().replace(/\s/g, '');
    return w === chip.toLowerCase().replace(/\s/g, '');
  });
}

function FilterSection({ id, title, Icon, open, onToggle, children }) {
  return (
    <div className="border-b border-line last:border-b-0 pb-5 mb-5 last:pb-0 last:mb-0">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center gap-2.5 mb-3 group"
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

function DualPriceSlider({ min, max, onChange }) {
  const span = PRICE_CEIL - PRICE_FLOOR;
  const minPct = ((min - PRICE_FLOOR) / span) * 100;
  const maxPct = ((max - PRICE_FLOOR) / span) * 100;
  const minOnTop = min > PRICE_FLOOR + span * 0.45;

  const snap = (n) => Math.round(n / 50) * 50;
  const commitMin = (raw) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    onChange({ min: Math.min(Math.max(PRICE_FLOOR, snap(n)), max - 50), max });
  };
  const commitMax = (raw) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    onChange({ min, max: Math.max(Math.min(PRICE_CEIL, snap(n)), min + 50) });
  };

  const box =
    'flex items-center h-10 rounded-lg border border-line bg-white px-2.5 focus-within:border-[var(--sk-gold-500)] focus-within:ring-1 focus-within:ring-[var(--sk-gold-500)]/30';

  return (
    <div className="pt-1 space-y-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <label className="block min-w-0">
          <span className="text-[11px] text-ink-500 font-medium">Min</span>
          <div className={`${box} mt-1`}>
            <span className="text-ink-500 text-sm mr-1 shrink-0">₹</span>
            <input
              type="number"
              min={PRICE_FLOOR}
              max={max - 50}
              step={50}
              value={min}
              aria-label="Minimum price"
              onChange={(e) => commitMin(e.target.value)}
              className="w-full min-w-0 bg-transparent outline-none text-sm font-semibold tabular-nums text-brand-900"
            />
          </div>
        </label>
        <span className="text-ink-400 pb-2.5" aria-hidden>—</span>
        <label className="block min-w-0">
          <span className="text-[11px] text-ink-500 font-medium">Max</span>
          <div className={`${box} mt-1`}>
            <span className="text-ink-500 text-sm mr-1 shrink-0">₹</span>
            <input
              type="number"
              min={min + 50}
              max={PRICE_CEIL}
              step={50}
              value={max}
              aria-label="Maximum price"
              onChange={(e) => commitMax(e.target.value)}
              className="w-full min-w-0 bg-transparent outline-none text-sm font-semibold tabular-nums text-brand-900"
            />
          </div>
        </label>
      </div>

      <div className="relative h-8 px-1">
        <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2 h-1 rounded-full bg-cream-400" />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full bg-[var(--sk-star)]"
          style={{ left: `calc(4px + ${minPct}%)`, right: `calc(4px + ${100 - maxPct}%)` }}
        />
        <input
          type="range"
          min={PRICE_FLOOR}
          max={PRICE_CEIL}
          step={50}
          value={min}
          aria-label="Minimum price"
          onChange={(e) => commitMin(e.target.value)}
          className="sk-range absolute inset-0 w-full"
          style={{ zIndex: minOnTop ? 5 : 3 }}
        />
        <input
          type="range"
          min={PRICE_FLOOR}
          max={PRICE_CEIL}
          step={50}
          value={max}
          aria-label="Maximum price"
          onChange={(e) => commitMax(e.target.value)}
          className="sk-range absolute inset-0 w-full"
          style={{ zIndex: 4 }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-ink-500 font-medium px-0.5">
        <span>₹ {PRICE_FLOOR}</span>
        <span>₹ {PRICE_CEIL}+</span>
      </div>
    </div>
  );
}

function FiltersPanel({
  slug,
  categories,
  categoryCounts,
  price,
  setPrice,
  weight,
  setWeight,
  special,
  setSpecial,
}) {
  const [open, setOpen] = useState({
    categories: true,
    price: true,
    weight: true,
    specialty: true,
  });
  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));
  const toggleWeight = (w) =>
    setWeight((cur) => (cur.includes(w) ? cur.filter((x) => x !== w) : [...cur, w]));
  const toggleSpecial = (id) =>
    setSpecial((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const catLinks = [
    ...categories.map((c) => ({
      slug: c.slug,
      name: c.name,
      to: c.slug === 'gift-hampers' ? '/gift-hampers' : `/category/${c.slug}`,
      count: categoryCounts[c.slug] ?? c.count ?? 0,
    })),
    ...EXTRA_CATS,
  ];

  return (
    <aside>
      <FilterSection
        id="categories"
        title="Categories"
        Icon={Users}
        open={open.categories}
        onToggle={toggle}
      >
        <ul className="space-y-0.5">
          {catLinks.map((c) => {
            const Icon = CAT_ICONS[c.slug] || Package;
            const active = slug === c.slug;
            return (
              <li key={c.slug}>
                <Link
                  to={c.to}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-1.5 py-2 text-[13px] transition-colors',
                    active
                      ? 'text-brand-900 font-semibold'
                      : 'text-ink-600 hover:text-brand-900'
                  )}
                >
                  <Icon size={15} className="text-[var(--sk-gold-500)] shrink-0" strokeWidth={1.75} />
                  <span className="flex-1 min-w-0 truncate">
                    {c.name}
                    <span className="text-ink-500 font-normal"> ({c.count})</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </FilterSection>

      <FilterSection
        id="price"
        title="Price Range"
        Icon={ShoppingBag}
        open={open.price}
        onToggle={toggle}
      >
        <DualPriceSlider min={price.min} max={price.max} onChange={setPrice} />
      </FilterSection>

      <FilterSection
        id="weight"
        title="Weight"
        Icon={Filter}
        open={open.weight}
        onToggle={toggle}
      >
        <div className="flex flex-wrap gap-2">
          {WEIGHTS.map((w) => {
            const on = weight.includes(w);
            return (
              <button
                key={w}
                type="button"
                onClick={() => toggleWeight(w)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-[12px] font-medium border transition-colors',
                  on
                    ? 'bg-[rgba(197,160,89,0.14)] text-brand-900 border-[var(--sk-gold-500)]'
                    : 'bg-white text-brand-900 border-line-strong hover:border-[var(--sk-gold-500)]'
                )}
              >
                {w}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection
        id="specialty"
        title="Speciality"
        Icon={Gift}
        open={open.specialty}
        onToggle={toggle}
      >
        <div className="space-y-2.5">
          {SPECIALTIES.map((s) => (
            <label
              key={s.id}
              className="flex items-center gap-2.5 text-[13px] text-ink-600 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={special.includes(s.id)}
                onChange={() => toggleSpecial(s.id)}
                className="h-4 w-4 rounded-[3px] border-line-strong accent-[var(--sk-brown-900)]"
              />
              {s.label}
            </label>
          ))}
        </div>
      </FilterSection>

      <div className="rounded-xl border border-line bg-cream-200/80 p-3.5 mt-1">
        <div className="flex items-start gap-3">
          <Gift size={28} className="text-[var(--sk-gold-500)] shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <div className="font-semibold text-brand-900 text-[13px] leading-snug">
              Looking for Corporate Gifting?
            </div>
            <p className="text-[12px] text-ink-600 mt-1 leading-relaxed">
              Bulk orders with custom packaging
            </p>
            <Link
              to="/corporate-gifts"
              className="inline-flex items-center gap-1 mt-2 text-[13px] font-semibold text-[var(--sk-gold-500)] hover:text-[var(--sk-star)]"
            >
              Contact Us <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function PLP() {
  const { slug = 'all' } = useParams();
  const [sort, setSort] = useState('popularity');
  const [price, setPrice] = useState({ min: PRICE_FLOOR, max: PRICE_CEIL });
  const [special, setSpecial] = useState([]);
  const [weight, setWeight] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data: allProducts, loading } = useProducts({ limit: 500 });
  const { data: categories } = useCategories();
  const cat = categories.find((c) => c.slug === slug);

  const categoryCounts = useMemo(() => {
    const counts = { all: allProducts.length };
    allProducts.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [allProducts]);

  const filtered = useMemo(() => {
    let list = [...allProducts];

    if (slug && slug !== 'all') {
      list = list.filter((p) => p.category === slug);
    }

    list = list.filter((p) => {
      const prices = [
        Number(p.price) || 0,
        ...(Array.isArray(p.variants) ? p.variants.map((v) => Number(v.price) || 0) : []),
      ].filter((n) => n > 0);
      if (!prices.length) return true;
      return prices.some((n) => n >= price.min && (price.max >= PRICE_CEIL || n <= price.max));
    });

    if (weight.length) {
      list = list.filter((p) => weight.some((w) => productHasWeight(p, w)));
    }

    if (special.length) {
      list = list.filter((p) =>
        special.some((id) => SPECIALTIES.find((s) => s.id === id)?.match(p))
      );
    }

    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sort === 'newest') list.reverse();
    else {
      list.sort((a, b) => {
        const score = (p) => (p.bestseller ? 1e6 : 0) + (p.reviews || 0) * (p.rating || 0);
        return score(b) - score(a);
      });
    }

    return list;
  }, [allProducts, slug, price, weight, special, sort]);

  useEffect(() => {
    setPage(1);
  }, [slug, sort, price.min, price.max, weight, special]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(safePage * PAGE_SIZE, total);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetFilters = () => {
    setPrice({ min: PRICE_FLOOR, max: PRICE_CEIL });
    setWeight([]);
    setSpecial([]);
    setSort('popularity');
    setPage(1);
  };

  const filterProps = {
    slug,
    categories,
    categoryCounts,
    price,
    setPrice,
    weight,
    setWeight,
    special,
    setSpecial,
  };

  const activeFilterCount =
    weight.length +
    special.length +
    (price.min > PRICE_FLOOR || price.max < PRICE_CEIL ? 1 : 0);

  return (
    <div className="bg-[var(--sk-cream-100)] min-h-[60vh]">
      <div className="sk-container py-6 md:py-8 grid md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr] gap-6 lg:gap-8">
        {/* Desktop filter sidebar */}
        <div className="hidden md:block sticky top-24 self-start">
          <div className="rounded-2xl border border-line bg-white/90 shadow-sk-sm p-4 lg:p-5">
            <FiltersPanel {...filterProps} />
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="text-[13px] md:text-sm text-ink-600">
              {loading && total === 0 ? (
                'Loading products…'
              ) : (
                <>
                  Showing{' '}
                  <span className="text-brand-900 font-medium">
                    {total === 0 ? '0' : `${start}–${end}`}
                  </span>{' '}
                  of{' '}
                  <span className="text-brand-900 font-medium">{total}</span>{' '}
                  {total === 1 ? 'product' : 'products'}
                </>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="md:hidden inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 py-2 text-sm font-semibold text-brand-900"
                data-testid="plp-filter-open"
              >
                <Filter size={14} /> Filter
                {activeFilterCount > 0 && (
                  <span className="ml-0.5 h-5 min-w-5 px-1 rounded-full bg-brand-900 text-white text-[10px] grid place-items-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-2">
                <label htmlFor="plp-sort" className="text-[13px] text-ink-600 whitespace-nowrap hidden sm:inline">
                  Sort by:
                </label>
                <div className="relative">
                  <select
                    id="plp-sort"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    data-testid="plp-sort"
                    className="appearance-none bg-white border border-line-strong rounded-lg pl-3 pr-8 py-2 text-[13px] text-brand-900 font-medium cursor-pointer min-w-[8.5rem] focus:outline-none focus:border-brand-900"
                  >
                    <option value="popularity">Popularity</option>
                    <option value="price-asc">Price: Low → High</option>
                    <option value="price-desc">Price: High → Low</option>
                    <option value="rating">Rating</option>
                    <option value="newest">Newest</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-ink-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {cat && (
            <h1 className="sr-only">{cat.name}</h1>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
            {loading && pageItems.length === 0
              ? Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)
              : pageItems.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>

          {!loading && total === 0 && (
            <div className="text-center py-16 text-ink-500">
              No products match your filters.{' '}
              <button
                type="button"
                onClick={resetFilters}
                className="text-brand-900 font-semibold underline"
              >
                Reset filters
              </button>
            </div>
          )}

          {!loading && total > PAGE_SIZE && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              {safePage < totalPages && (
                <button
                  type="button"
                  onClick={() => {
                    setPage((p) => p + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="sk-btn-outline !px-8"
                  data-testid="plp-load-more"
                >
                  Load more
                </button>
              )}
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const n = i + 1;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        setPage(n);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      aria-label={`Page ${n}`}
                      aria-current={n === safePage ? 'page' : undefined}
                      className={cn(
                        'h-9 w-9 rounded-lg text-sm font-semibold transition-colors',
                        n === safePage
                          ? 'bg-brand-900 text-white'
                          : 'bg-white border border-line text-ink-600 hover:border-brand-700'
                      )}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter bottom sheet */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            aria-label="Close filters"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="relative bg-white rounded-t-3xl shadow-sk-lg max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1.5 w-10 rounded-full bg-line-strong" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3 border-b border-line">
              <div className="font-display font-bold text-brand-900 text-xl">Filters</div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm font-semibold text-ink-500 hover:text-brand-900"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="h-9 w-9 rounded-full bg-cream-200 grid place-items-center text-brand-900"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto px-5 py-5 flex-1">
              <FiltersPanel {...filterProps} />
            </div>
            <div className="p-4 border-t border-line bg-white safe-pb">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="sk-btn-primary w-full !py-3"
                data-testid="plp-filter-apply"
              >
                Show {total} {total === 1 ? 'Result' : 'Results'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
