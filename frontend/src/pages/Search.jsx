import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard, { HamperCard } from '@/components/shared/ProductCard';
import { useProducts, useHampers, ProductSkeleton, hamperMatchesQuery } from '@/lib/catalog';

export default function Search() {
  const [sp] = useSearchParams();
  const q = (sp.get('q') || '');
  const { data: products, loading: lp } = useProducts({ q: q || undefined, limit: 40 });
  const { data: hampers } = useHampers();
  const matchedHampers = (hampers || []).filter((h) => hamperMatchesQuery(h, q));
  const total = products.length + matchedHampers.length;

  return (
    <div>
      <div className="border-b border-line bg-cream-200">
        <div className="sk-container py-3 md:py-3.5">
          <h1 className="text-[15px] md:text-base font-semibold text-brand-900 tracking-tight">
            {q ? <>Results for “{q}”</> : 'Search'}
          </h1>
          {q ? (
            <p className="text-ink-500 text-xs mt-0.5">{lp ? 'Searching…' : `${total} match${total === 1 ? '' : 'es'}`}</p>
          ) : (
            <p className="text-ink-500 text-xs mt-0.5">Use the search bar in the header to find dry fruits, nuts, and hampers.</p>
          )}
        </div>
      </div>
      <div className="sk-container py-6">
        {!q && <div className="text-ink-500 text-sm">Try “almonds”, “wedding hamper”, or “dates” in the header search.</div>}
        {q && !lp && products.length === 0 && matchedHampers.length === 0 && (
          <div className="text-ink-500 text-sm">No matches found. Try a different keyword.</div>
        )}

        {matchedHampers.length > 0 && (
          <div className="mb-10">
            <div className="font-display text-lg font-bold text-brand-900 mb-3">Hampers</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {matchedHampers.map((h) => <HamperCard key={h.id} h={h} />)}
            </div>
          </div>
        )}
        {products.length > 0 && (
          <div>
            <div className="font-display text-lg font-bold text-brand-900 mb-3">Products</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {lp
                ? Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
                : products.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
