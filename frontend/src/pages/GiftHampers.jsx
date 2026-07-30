import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHampers, HamperSkeleton } from '@/lib/catalog';
import { HamperCard } from '@/components/shared/ProductCard';
import { PageHeader } from '@/components/shared/Breadcrumb';

const CHIPS = ['All', 'Birthday', 'Wedding', 'Corporate', 'Festival', 'Luxury'];
const BUDGETS = [{ l: 'Under ₹1,500', max: 1500 }, { l: '₹1,500–₹2,500', min: 1500, max: 2500 }, { l: '₹2,500–₹3,500', min: 2500, max: 3500 }, { l: 'Above ₹3,500', min: 3500 }];

export default function GiftHampers() {
  const [chip, setChip] = useState('All');
  const [budget, setBudget] = useState(null);
  const { data: hampers, loading } = useHampers();

  const list = hampers.filter((h) => {
    if (chip !== 'All' && !h.tags.includes(chip) && h.tier !== chip) return false;
    if (budget) {
      if (budget.min && h.price < budget.min) return false;
      if (budget.max && h.price > budget.max) return false;
    }
    return true;
  });

  return (
    <div>
      <PageHeader title="Gift Hampers" subtitle="Curated dry-fruit gift hampers for every occasion — elegantly packed, delivered fresh." breadcrumb={[{ label: 'Gift Hampers' }]} />
      <div className="sk-container py-8 md:py-12">
        <div className="flex flex-wrap gap-2 mb-4">
          {CHIPS.map((c) => (<button key={c} onClick={() => setChip(c)} className={`px-4 py-2 rounded-full text-sm font-medium border transition ${chip === c ? 'bg-brand-900 text-white border-brand-900' : 'bg-white text-brand-900 border-line-strong hover:border-brand-900'}`}>{c}</button>))}
        </div>
        <div className="flex flex-wrap gap-2 mb-8">
          {BUDGETS.map((b) => (<button key={b.l} onClick={() => setBudget(budget?.l === b.l ? null : b)} className={`px-4 py-1.5 rounded-full text-[12px] font-medium border transition ${budget?.l === b.l ? 'bg-gold-500 text-white border-gold-500' : 'bg-white text-brand-900 border-line-strong'}`}>{b.l}</button>))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {loading ? Array.from({length:8}).map((_,i)=><HamperSkeleton key={i} />) : list.map((h) => <HamperCard key={h.id} h={h} />)}
        </div>
        {!loading && list.length === 0 && <div className="text-center py-16 text-ink-500">No hampers match your filters.</div>}

        <div className="mt-16 rounded-2xl bg-cream-300 p-8 md:p-12 text-center">
          <div className="sk-section-eyebrow">CAN’T FIND THE PERFECT HAMPER?</div>
          <h3 className="sk-section-title text-2xl md:text-3xl mt-2">Build Your Own Hamper</h3>
          <p className="text-ink-600 mt-2 max-w-xl mx-auto">Design a custom hamper from scratch with your favourite items, personalised message, and preferred budget.</p>
          <Link to="/build-hamper/budget" className="sk-btn-primary mt-5 inline-flex">Start Building</Link>
        </div>
      </div>
    </div>
  );
}
