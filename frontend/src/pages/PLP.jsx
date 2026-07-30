import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Filter, ChevronDown, X } from 'lucide-react';
import ProductCard from '@/components/shared/ProductCard';
import { PageHeader } from '@/components/shared/Breadcrumb';
import { useProducts, useCategories, ProductSkeleton } from '@/lib/catalog';

const SPECIALTIES = ['Natural', 'Premium', 'Non-GMO', 'Handpicked'];
const WEIGHTS = ['250g', '500g', '1kg'];

export default function PLP() {
  const { slug = 'all' } = useParams();
  const [sort, setSort] = useState('popularity');
  const [priceMax, setPriceMax] = useState(15000);
  const [special, setSpecial] = useState([]);
  const [weight, setWeight] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const backendSort = sort === 'price-asc' ? 'price-asc' : sort === 'price-desc' ? 'price-desc' : sort === 'rating' ? 'rating' : undefined;
  const { data: allProducts, loading } = useProducts({ category: slug === 'all' ? undefined : slug, sort: backendSort, limit: 200 });
  const { data: categories } = useCategories();
  const cat = categories.find((c) => c.slug === slug);

  const items = useMemo(() => allProducts.filter((p) => p.price <= priceMax), [allProducts, priceMax]);

  const title = cat ? cat.name : (slug === 'all' ? 'All Products' : slug.replace('-', ' '));

  const Filters = () => (
    <aside className="space-y-6">
      <div>
        <div className="font-semibold text-brand-900 mb-3">Category</div>
        <ul className="space-y-1.5 text-sm">
          <li><Link to="/category/all" className={`hover:text-brand-700 ${slug === 'all' ? 'text-brand-700 font-semibold' : 'text-ink-600'}`}>All Products</Link></li>
          {categories.map((c) => (
            <li key={c.slug}><Link to={`/category/${c.slug}`} className={`hover:text-brand-700 flex items-center justify-between ${slug === c.slug ? 'text-brand-700 font-semibold' : 'text-ink-600'}`}>{c.name} <span className="text-[11px] text-ink-500">({c.count ?? '·'})</span></Link></li>
          ))}
        </ul>
      </div>
      <div>
        <div className="font-semibold text-brand-900 mb-3">Price Range</div>
        <input type="range" min={99} max={15000} step={100} value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))} className="w-full accent-[var(--sk-brown-900)]" />
        <div className="text-[12px] text-ink-600 mt-1">Up to ₹{priceMax.toLocaleString('en-IN')}</div>
      </div>
      <div>
        <div className="font-semibold text-brand-900 mb-3">Pack Size</div>
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
            <div className="text-sm text-ink-600">Showing <b className="text-brand-900">{items.length}</b> {items.length === 1 ? 'product' : 'products'}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setMobileOpen(true)} className="md:hidden sk-btn-outline !py-2 !px-3 text-sm"><Filter size={14} /> Filter</button>
              <div className="relative">
                <select value={sort} onChange={(e) => setSort(e.target.value)} data-testid="plp-sort" className="sk-input !py-2 !pr-8 text-sm cursor-pointer">
                  <option value="popularity">Popularity</option>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                  <option value="rating">Rating</option>
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
            {loading ? Array.from({length:6}).map((_,i)=><ProductSkeleton key={i} />) : items.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
          {!loading && items.length === 0 && <div className="text-center py-16 text-ink-500">No products match your filters. <button onClick={() => setPriceMax(15000)} className="text-brand-900 font-semibold underline">Reset filters</button></div>}
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-50" onClick={() => setMobileOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5 max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><div className="font-display font-bold text-brand-900 text-lg">Filters</div><button onClick={() => setMobileOpen(false)}><X size={20} /></button></div>
            <Filters />
            <button onClick={() => setMobileOpen(false)} className="sk-btn-primary w-full mt-5">Show {items.length} Results</button>
          </div>
        </div>
      )}
    </div>
  );
}
