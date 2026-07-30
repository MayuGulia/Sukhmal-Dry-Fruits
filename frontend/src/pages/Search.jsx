import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/shared/Breadcrumb';
import ProductCard, { HamperCard } from '@/components/shared/ProductCard';
import { useProducts, useHampers, ProductSkeleton } from '@/lib/catalog';
import { Search as SearchIcon } from 'lucide-react';

export default function Search() {
  const [sp, setSp] = useSearchParams();
  const q = (sp.get('q') || '');
  const { data: products, loading: lp } = useProducts({ q: q || undefined, limit: 40 });
  const { data: hampers } = useHampers();
  const matchedHampers = hampers.filter((h) => (h.name + ' ' + h.tags.join(' ')).toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader title={q ? `Results for “${q}”` : 'Search'} subtitle={q ? `${products.length + matchedHampers.length} matches` : 'Search across our catalog'} />
      <div className="sk-container py-8">
        <form onSubmit={(e) => { e.preventDefault(); setSp({ q: e.target.q.value }); }} className="max-w-xl relative mb-8">
          <input name="q" defaultValue={q} placeholder="Search dry fruits, hampers, occasions…" className="sk-input pr-12" />
          <button className="absolute right-1.5 top-1.5 h-9 w-9 rounded-lg bg-brand-900 text-white grid place-items-center" aria-label="Search"><SearchIcon size={18} /></button>
        </form>

        {!q && <div className="text-ink-500">Try searching for “almonds”, “wedding hamper”, or “dates”.</div>}
        {q && !lp && products.length === 0 && matchedHampers.length === 0 && <div className="text-ink-500">No matches found. Try a different keyword.</div>}

        {matchedHampers.length > 0 && (<div className="mb-10"><div className="font-display text-xl font-bold text-brand-900 mb-3">Hampers</div><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{matchedHampers.map((h) => <HamperCard key={h.id} h={h} />)}</div></div>)}
        {products.length > 0 && (<div><div className="font-display text-xl font-bold text-brand-900 mb-3">Products</div><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{lp ? Array.from({length:4}).map((_,i)=><ProductSkeleton key={i} />) : products.map((p) => <ProductCard key={p.id} p={p} />)}</div></div>)}
      </div>
    </div>
  );
}
