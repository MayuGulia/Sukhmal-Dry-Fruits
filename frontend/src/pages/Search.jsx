import React, { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/Breadcrumb';
import ProductCard from '@/components/shared/ProductCard';
import { PRODUCTS, HAMPERS } from '@/data/mockCatalog';
import { HamperCard } from '@/components/shared/ProductCard';
import { Search as SearchIcon } from 'lucide-react';

export default function Search() {
  const [sp, setSp] = useSearchParams();
  const q = (sp.get('q') || '').toLowerCase();

  const products = useMemo(() => {
    if (!q) return [];
    return PRODUCTS.filter((p) => (p.name + ' ' + p.tagline + ' ' + p.category).toLowerCase().includes(q));
  }, [q]);
  const hampers = useMemo(() => {
    if (!q) return [];
    return HAMPERS.filter((h) => (h.name + ' ' + h.tags.join(' ')).toLowerCase().includes(q));
  }, [q]);

  return (
    <div>
      <PageHeader title={q ? `Results for \u201c${q}\u201d` : 'Search'} subtitle={q ? `${products.length + hampers.length} matches` : 'Search across our catalog'} />
      <div className="sk-container py-8">
        <form onSubmit={(e) => { e.preventDefault(); const v = e.target.q.value; setSp({ q: v }); }} className="max-w-xl relative mb-8">
          <input name="q" defaultValue={q} placeholder="Search dry fruits, hampers, occasions..." className="sk-input pr-12" />
          <button className="absolute right-1.5 top-1.5 h-9 w-9 rounded-lg bg-brand-900 text-white grid place-items-center" aria-label="Search"><SearchIcon size={18} /></button>
        </form>

        {!q && <div className="text-ink-500">Try searching for \u201calmonds\u201d, \u201cwedding hamper\u201d, or \u201cdates\u201d.</div>}
        {q && products.length === 0 && hampers.length === 0 && <div className="text-ink-500">No matches found. Try a different keyword.</div>}

        {hampers.length > 0 && (
          <div className="mb-10">
            <div className="font-display text-xl font-bold text-brand-900 mb-3">Hampers</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{hampers.map((h) => <HamperCard key={h.id} h={h} />)}</div>
          </div>
        )}
        {products.length > 0 && (
          <div>
            <div className="font-display text-xl font-bold text-brand-900 mb-3">Products</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{products.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
