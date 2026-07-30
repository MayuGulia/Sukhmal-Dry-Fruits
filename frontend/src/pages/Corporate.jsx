import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/Breadcrumb';
import { HamperCard, SectionHeader } from '@/components/shared/ProductCard';
import { useHampers, HamperSkeleton } from '@/lib/catalog';
import { Briefcase, FileText, Truck, ShieldCheck, Send } from 'lucide-react';

export default function Corporate() {
  const { data: hampers, loading } = useHampers();
  const list = hampers.filter((h) => h.tags.includes('Corporate') || h.tier === 'Premium');
  return (
    <div>
      <PageHeader title="Corporate Gifting" subtitle="Premium dry-fruit hampers with your branding — for employees, clients, and events." breadcrumb={[{ label: 'Corporate Gifts' }]} />
      <div className="sk-container py-12">
        <div className="grid md:grid-cols-4 gap-4 mb-10">
          {[{Ic:Briefcase,t:'Custom Branding',s:'Logo, cards, ribbons'},{Ic:FileText,t:'GST Invoicing',s:'For B2B compliance'},{Ic:Truck,t:'Pan-India Delivery',s:'On-time, always'},{Ic:ShieldCheck,t:'Bulk Discounts',s:'From 25 units'}].map(({Ic,t,s})=>(<div key={t} className="sk-card p-5"><Ic size={26} className="text-brand-900" /><div className="font-display font-bold text-brand-900 mt-2">{t}</div><div className="text-[12px] text-ink-500 mt-0.5">{s}</div></div>))}
        </div>
        <SectionHeader title="Popular Corporate Hampers" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{loading ? Array.from({length:4}).map((_,i)=><HamperSkeleton key={i} />) : list.map((h) => <HamperCard key={h.id} h={h} />)}</div>
        <div className="mt-14 rounded-2xl bg-brand-900 text-white p-8 md:p-12 text-center">
          <div className="sk-section-eyebrow !text-gold-300">GET IN TOUCH</div>
          <h3 className="font-display text-3xl mt-2">Ready to gift your team?</h3>
          <p className="opacity-80 mt-2 max-w-lg mx-auto">Send us your requirements and we’ll craft a proposal within 24 hours.</p>
          <Link to="/wedding-gifts#form" className="sk-btn-gold mt-5 inline-flex"><Send size={16} /> Send Enquiry</Link>
        </div>
      </div>
    </div>
  );
}
