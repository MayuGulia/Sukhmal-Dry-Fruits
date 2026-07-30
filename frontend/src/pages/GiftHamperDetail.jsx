import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HAMPERS } from '@/data/mockCatalog';
import { PageHeader } from '@/components/shared/Breadcrumb';
import { inr } from '@/lib/utils';
import { ShoppingBag, Package, Calendar, ChevronRight, Gift, ShieldCheck } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { HamperCard, SectionHeader } from '@/components/shared/ProductCard';

export default function GiftHamperDetail() {
  const { slug } = useParams();
  const h = HAMPERS.find((x) => x.slug === slug) || HAMPERS[0];
  const [msg, setMsg] = useState('');
  const [date, setDate] = useState('');
  const { add } = useCart();

  return (
    <div>
      <PageHeader title={h.name} breadcrumb={[{ label: 'Gift Hampers', to: '/gift-hampers' }, { label: h.name }]} />
      <div className="sk-container py-8 md:py-12 grid md:grid-cols-2 gap-10">
        <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-cream-200"><img src={h.image} alt={h.name} className="w-full h-full object-cover" /></div>
        <div>
          <div className="flex items-center gap-2">
            <span className="sk-pill sk-pill-gold">{h.tier}</span>
            {h.tags.map((t) => <span key={t} className="sk-pill">{t}</span>)}
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-brand-900 mt-3">{h.name}</h1>
          <div className="text-ink-500 mt-1 text-sm"><Package size={14} className="inline mr-1" /> {h.weight} • Delivered pan-India</div>

          <div className="mt-5 flex items-end gap-3">
            <div className="font-display font-bold text-brand-900 text-3xl">{inr(h.price)}</div>
            {h.mrp > h.price && <div className="text-ink-500 line-through pb-1">{inr(h.mrp)}</div>}
          </div>
          <div className="text-[12px] text-ink-500 mt-1">Inclusive of GST</div>

          <div className="mt-6">
            <div className="font-semibold text-brand-900 mb-2">What’s Inside</div>
            <ul className="space-y-1.5">
              {h.contents.map((c) => <li key={c} className="flex items-center gap-2 text-sm text-ink-600"><Gift size={14} className="text-gold-400" /> {c}</li>)}
            </ul>
          </div>

          <div className="mt-6">
            <label className="font-semibold text-brand-900 text-sm">Personalised Message (optional)</label>
            <textarea value={msg} onChange={(e) => setMsg(e.target.value.slice(0, 150))} rows={3} placeholder="e.g. Wishing you a joyous festival, love — The Sharmas" className="sk-input mt-2" />
            <div className="text-[11px] text-ink-500 mt-1 text-right">{msg.length}/150</div>
          </div>

          <div className="mt-4">
            <label className="font-semibold text-brand-900 text-sm inline-flex items-center gap-1.5"><Calendar size={14} /> Delivery Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="sk-input mt-2 max-w-xs" />
          </div>

          <button onClick={() => add({ id: h.id, name: h.name, images: [h.image], slug: h.slug, meta: { message: msg, deliveryDate: date, type: 'hamper' } }, { qty: 1, variant: { w: h.weight, price: h.price }, source: 'hamper' })} className="sk-btn-primary mt-6 !py-3.5 w-full md:w-auto !px-8" data-testid="hamper-add-cart"><ShoppingBag size={16} /> Add Hamper to Cart</button>

          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-5">
            {[{l:'Free Shipping',ic:'🚚'},{l:'Gift Ready',ic:'🎁'},{l:'Verified Fresh',ic:'🛡️'}].map((x) => (
              <div key={x.l} className="text-center"><div className="text-2xl">{x.ic}</div><div className="text-[11px] font-semibold text-brand-900 mt-1">{x.l}</div></div>
            ))}
          </div>
        </div>
      </div>

      <div className="sk-container pb-16">
        <SectionHeader title="You May Also Like" />
        <div className="sk-scroll-x md:grid md:grid-cols-4 md:gap-4 md:scroll-auto">
          {HAMPERS.filter((x) => x.id !== h.id).slice(0, 4).map((x) => <HamperCard key={x.id} h={x} />)}
        </div>
      </div>
    </div>
  );
}
