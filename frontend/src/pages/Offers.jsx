import React from 'react';
import { PageHeader } from '@/components/shared/Breadcrumb';
import { HamperCard } from '@/components/shared/ProductCard';
import ProductCard from '@/components/shared/ProductCard';
import { HAMPERS, PRODUCTS } from '@/data/mockCatalog';
import { Tag } from 'lucide-react';

export default function Offers() {
  return (
    <div>
      <PageHeader title="Offers & Deals" subtitle="Save big on premium dry fruits, nuts, and hampers." breadcrumb={[{ label: 'Offers' }]} />
      <div className="sk-container py-12">
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {[{ code: 'WELCOME10', desc: '10% OFF on your first order' }, { code: 'FESTIVE500', desc: '₹500 OFF on orders above ₹1,500' }, { code: 'BULK25', desc: '25% OFF on 25+ hampers' }].map((c) => (
            <div key={c.code} className="sk-card p-5 border-dashed border-2 border-gold-500">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gold-500 text-white grid place-items-center"><Tag size={18} /></div>
                <div>
                  <div className="font-display font-bold text-brand-900 text-lg">{c.code}</div>
                  <div className="text-[12px] text-ink-600">{c.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="font-display text-2xl text-brand-900 font-bold mb-4">Discounted Hampers</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {HAMPERS.slice(0, 4).map((h) => <HamperCard key={h.id} h={h} />)}
        </div>
        <div className="font-display text-2xl text-brand-900 font-bold mb-4">Products on Sale</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PRODUCTS.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </div>
    </div>
  );
}
