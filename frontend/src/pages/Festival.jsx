import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/Breadcrumb';
import { HamperCard, SectionHeader } from '@/components/shared/ProductCard';
import { FESTIVALS, HAMPERS } from '@/data/mockCatalog';
import { ChevronRight } from 'lucide-react';

export default function Festival() {
  return (
    <div>
      <PageHeader title="Festival Collections" subtitle="Themed hampers curated for every celebration in the Indian calendar." breadcrumb={[{ label: 'Festival Collections' }]} />
      <div className="sk-container py-12 space-y-14">
        {FESTIVALS.map((f) => {
          const list = HAMPERS.filter((h) => h.tags.some((t) => t.toLowerCase() === f.key.replace('-',' ') || t.toLowerCase() === f.name.toLowerCase())).slice(0, 4);
          const items = list.length ? list : HAMPERS.slice(0, 4);
          return (
            <div key={f.key} id={f.key}>
              <div className="rounded-2xl overflow-hidden relative h-40 md:h-56 mb-6" style={{ background: `linear-gradient(135deg, ${f.hue}33, ${f.hue}88)` }}>
                <img src={f.hero} alt="" className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-70" />
                <div className="relative sk-container py-6 md:py-10">
                  <div className="sk-section-eyebrow" style={{ color: f.hue }}>FESTIVAL COLLECTION</div>
                  <div className="font-display text-3xl md:text-5xl font-bold text-white mt-1">{f.name}</div>
                  <div className="text-white/80 text-sm md:text-base mt-1 max-w-lg">{f.copy}</div>
                </div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-brand-900 font-semibold">Handpicked {f.name} Hampers</div>
                <Link to="/gift-hampers" className="sk-btn-ghost text-sm">View All <ChevronRight size={14} /></Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {items.map((h) => <HamperCard key={`${f.key}-${h.id}`} h={h} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
