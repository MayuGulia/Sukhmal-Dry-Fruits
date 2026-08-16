import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Percent, Sparkles } from 'lucide-react';
import ProductCard from '@/components/shared/ProductCard';
import { useProducts, useHampers, ProductSkeleton, HamperSkeleton } from '@/lib/catalog';
import { PremiumHamperCard } from '@/pages/GiftHampers';

const HIGHLIGHTS = [
  { Ic: Percent, t: 'Seasonal markdowns', s: 'Curated cuts on bestsellers every week' },
  { Ic: Sparkles, t: 'Hamper combos', s: 'Gift-ready sets at special onwards pricing' },
  { Ic: Clock, t: 'Limited windows', s: 'Festival drops while stocks last' },
];

export default function Offers() {
  const { data: products, loading } = useProducts({ limit: 12 });
  const { data: hampers, loading: hamperLoading } = useHampers();
  const saleProducts = products.filter((p) => p.mrp && p.mrp > p.price);
  const showProducts = saleProducts.length ? saleProducts : products;
  const saleHampers = hampers.filter((h) => h.mrp && h.mrp > h.price);
  const showHampers = saleHampers.length ? saleHampers : hampers;

  return (
    <div className="bg-[var(--sk-cream-100)]">
      <div className="relative overflow-hidden bg-brand-900 text-white">
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: 'radial-gradient(ellipse at 20% 20%, #BDAA7E55, transparent 55%), radial-gradient(ellipse at 80% 80%, #E8A11A33, transparent 50%)' }}
        />
        <div className="relative sk-container py-12 md:py-16">
          <div className="text-white/70 text-[12px] mb-3">
            <Link to="/" className="hover:text-white">Home</Link>
            <span className="mx-1.5">›</span>
            <span className="text-white font-medium">Offers</span>
          </div>
          <p className="font-display italic text-[var(--sk-gold-300)] text-xl">Savings & Seasonal</p>
          <h1 className="font-display font-bold text-4xl md:text-5xl mt-1 max-w-2xl leading-tight">
            Offers & <span className="text-[var(--sk-gold-400)]">Deals</span>
          </h1>
          <p className="text-white/80 mt-3 max-w-xl text-sm md:text-base">
            Save on premium dry fruits, nuts, and curated gift hampers — without compromising on quality.
          </p>
          <div className="mt-8 grid sm:grid-cols-3 gap-3 max-w-3xl">
            {HIGHLIGHTS.map(({ Ic, t, s }) => (
              <div key={t} className="flex items-start gap-3 bg-white/10 border border-white/15 rounded-xl px-4 py-3">
                <Ic size={18} strokeWidth={1.5} className="text-[var(--sk-gold-300)] mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-sm">{t}</div>
                  <div className="text-[11px] text-white/70 mt-0.5">{s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sk-container py-12 md:py-14">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <div className="sk-section-eyebrow">GIFTING</div>
            <h2 className="font-display font-bold text-brand-900 text-2xl md:text-3xl mt-1">Discounted Hampers</h2>
          </div>
          <Link to="/gift-hampers" className="sk-btn-ghost text-sm hidden sm:inline-flex">Shop Hampers →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 mb-14">
          {hamperLoading
            ? Array.from({ length: 4 }).map((_, i) => <HamperSkeleton key={i} />)
            : showHampers.slice(0, 4).map((h) => <PremiumHamperCard key={h.id} h={h} />)}
        </div>

        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <div className="sk-section-eyebrow">EVERYDAY ESSENTIALS</div>
            <h2 className="font-display font-bold text-brand-900 text-2xl md:text-3xl mt-1">Products on Sale</h2>
          </div>
          <Link to="/category/all" className="sk-btn-ghost text-sm hidden sm:inline-flex">View Shop →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
            : showProducts.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </div>
    </div>
  );
}
