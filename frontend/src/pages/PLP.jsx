import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Filter, ChevronDown, X } from 'lucide-react';
import ProductCard, { SectionHeader } from '@/components/shared/ProductCard';
import { PageHeader } from '@/components/shared/Breadcrumb';
import { PRODUCTS, CATEGORIES } from '@/data/mockCatalog';

const SPECIALTIES = ['Natural', 'Premium', 'No Preservatives', 'Handpicked'];
const WEIGHTS = ['250g', '500g', '1kg', '2kg', '5kg+'];

export default function PLP() {
  const { slug = 'all' } = useParams();
  const cat = CATEGORIES.find((c) => c.slug === slug);
  const [sort, setSort] = useState('popularity');
  const [priceMax, setPriceMax] = useState(2500);
  const [special, setSpecial] = useState([]);
  const [weight, setWeight] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = useMemo(() => {
    let list = PRODUCTS.filter((p) => (slug === 'all' ? true : p.category === slug));
    list = list.filter((p) => p.price <= priceMax);
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    if (sort === 'newest') list.sort((a, b) => b.reviews - a.reviews);
    return list;
  }, [slug, sort, priceMax, special, weight]);

  const title = cat ? cat.name : (slug === 'all' ? 'All Products' : slug.replace('-', ' '));

  const Filters = () => (
    <aside className="space-y-6">
      <div>
        <div className="font-semibold text-brand-900 mb-3">Category</div>
        <ul className="space-y-1.5 text-sm">
          <li><Link to="/category/all" className={`hover:text-brand-700 ${slug === 'all' ? 'text-brand-700 font-semibold' : 'text-ink-600'}`}>All Products ({PRODUCTS.length})</Link></li>
          {CATEGORIES.filter((c) => c.slug !== 'gift-hampers').map((c) => (
            <li key={c.slug}><Link to={`/category/${c.slug}`} className={`hover:text-brand-700 flex items-center justify-between ${slug === c.slug ? 'text-brand-700 font-semibold' : 'text-ink-600'}`}>{c.name} <span className="text-[11px] text-ink-500">({PRODUCTS.filter(p => p.category === c.slug).length})</span></Link></li>
          ))}
        </ul>
      </div>
      <div>
        <div className="font-semibold text-brand-900 mb-3">Price Range</div>
        <input type="range" min={99} max={5000} value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))} className="w-full accent-[var(--sk-brown-900)]" />
        <div className="text-[12px] text-ink-600 mt-1">Up to ₹{priceMax.toLocaleString('en-IN')}</div>
      </div>
      <div>
        <div className="font-semibold text-brand-900 mb-3">Weight</div>
        {WEIGHTS.map((w) => (
          <label key={w} className="flex items-center gap-2 text-sm mb-1.5"><input type="checkbox" checked={weight.includes(w)} onChange={() => setWeight((cur) => cur.includes(w) ? cur.filter(x => x !== w) : [...cur, w])} /> {w}</label>
        ))}
      </div>
      <div>
        <div className="font-semibold text-brand-900 mb-3">Speciality</div>
        {SPECIALTIES.map((s) => (
          <label key={s} className="flex items-center gap-2 text-sm mb-1.5"><input type="checkbox" checked={special.includes(s)} onChange={() => setSpecial((cur) => cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s])} /> {s}</label>
        ))}
      </div>
      <div className="sk-card p-4 bg-cream-300">
        <div className="font-display font-bold text-brand-900">Bulk / Corporate Order?</div>
        <div className="text-[12px] text-ink-600 mt-1">Custom branding, GST invoice, pan-India delivery.</div>
        <Link to="/corporate-gifts" className="sk-btn-primary mt-3 w-full text-sm !py-2">Enquire Now</Link>
      </div>
    </aside>
  );

  return (
    <div>
      <PageHeader title={title.charAt(0).toUpperCase() + title.slice(1)} subtitle={cat?.tagline || 'Discover our full range of premium products.'} breadcrumb={[{ label: 'Shop', to: '/category/all' }, { label: title }]} />
      <div className="sk-container py-8 md:py-12 grid md:grid-cols-[240px_1fr] gap-8">
        <div className="hidden md:block"><Filters /></div>
        <div>
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="text-sm text-ink-600">Showing <b className="text-brand-900">{items.length}</b> of {PRODUCTS.length} products</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setMobileOpen(true)} className="md:hidden sk-btn-outline !py-2 !px-3 text-sm"><Filter size={14} /> Filter</button>
              <div className="relative">
                <select value={sort} onChange={(e) => setSort(e.target.value)} data-testid="plp-sort" className="sk-input !py-2 !pr-8 text-sm cursor-pointer">
                  <option value="popularity">Popularity</option>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                  <option value="rating">Rating</option>
                  <option value="newest">Newest</option>
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
            {items.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </div>
      </div>

      {/* Mobile filter sheet */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-50" onClick={() => setMobileOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5 max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="font-display font-bold text-brand-900 text-lg">Filters</div>
              <button onClick={() => setMobileOpen(false)}><X size={20} /></button>
            </div>
            <Filters />
            <button onClick={() => setMobileOpen(false)} className="sk-btn-primary w-full mt-5">Show {items.length} Results</button>
          </div>
        </div>
      )}
    </div>
  );
}
