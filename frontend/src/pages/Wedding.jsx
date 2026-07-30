import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/Breadcrumb';
import { HamperCard, SectionHeader } from '@/components/shared/ProductCard';
import { HAMPERS } from '@/data/mockCatalog';
import { MessageCircle, Instagram, Send, Award, ShieldCheck, Package, Users, Heart } from 'lucide-react';

export default function Wedding() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', occasion: 'Wedding', qty: '', notes: '' });
  const [sent, setSent] = useState(false);
  const submit = (e) => { e.preventDefault(); setSent(true); };

  return (
    <div>
      <section className="relative overflow-hidden bg-cream-300">
        <div className="absolute inset-0 opacity-30"><img src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&auto=format&fit=crop" alt="" className="w-full h-full object-cover" /></div>
        <div className="relative sk-container py-16 md:py-28">
          <div className="sk-section-eyebrow">CELEBRATE UNIONS, ELEGANTLY</div>
          <h1 className="font-display text-4xl md:text-6xl text-brand-900 font-bold mt-2 max-w-3xl">Wedding Gift Hampers, Beautifully Curated</h1>
          <p className="text-ink-600 mt-4 max-w-xl md:text-lg">Delight your guests and loved ones with premium dry-fruit hampers. Bulk pricing, custom branding, and pan-India delivery available.</p>
        </div>
      </section>

      <div className="sk-container py-14 md:py-20">
        <SectionHeader eyebrow="WHY SUKHMAL" title="Why Choose Us for Your Wedding" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[{Ic:Award,t:'Premium Quality',s:'Grade-A only'},{Ic:Package,t:'Custom Branding',s:'Your logo & cards'},{Ic:Users,t:'Bulk Pricing',s:'From 25 pieces'},{Ic:ShieldCheck,t:'Pan-India',s:'20,000+ pincodes'},{Ic:Heart,t:'On-Time Delivery',s:'Never miss the date'}].map(({Ic,t,s})=>(
            <div key={t} className="sk-card p-5 text-center"><Ic size={26} className="mx-auto text-brand-900" /><div className="font-display font-bold text-brand-900 mt-2">{t}</div><div className="text-[12px] text-ink-500 mt-0.5">{s}</div></div>
          ))}
        </div>
      </div>

      <div className="bg-cream-200 py-14">
        <div className="sk-container">
          <SectionHeader eyebrow="HAND-PICKED" title="Popular Wedding Hampers" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {HAMPERS.filter((h) => h.tags.includes('Wedding') || h.tier === 'Luxury').map((h) => <HamperCard key={h.id} h={h} />)}
          </div>
        </div>
      </div>

      <div className="sk-container py-14 md:py-20 grid md:grid-cols-2 gap-10">
        <div>
          <div className="sk-section-eyebrow">BULK ORDER ENQUIRY</div>
          <h3 className="sk-section-title text-3xl mt-2">Tell us about your event</h3>
          <p className="text-ink-600 mt-2">A dedicated wedding coordinator will get back within 2 business hours.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="sk-btn-outline text-[var(--sk-green-500)] border-[var(--sk-green-500)]"><MessageCircle size={16} /> WhatsApp Us</a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="sk-btn-outline"><Instagram size={16} /> Instagram DM</a>
          </div>
        </div>
        <form onSubmit={submit} className="sk-card p-6 md:p-8 space-y-3">
          {sent ? (
            <div className="text-center py-8">
              <div className="font-display font-bold text-brand-900 text-2xl">Thank you!</div>
              <p className="text-ink-600 mt-2">We’ll reach out shortly.</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-3">
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="sk-input" placeholder="Full name" />
                <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="sk-input" placeholder="Phone number" />
              </div>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="sk-input" placeholder="Email" />
              <select value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} className="sk-input">
                {['Wedding','Reception','Sangeet','Engagement','Anniversary','Other'].map((o) => <option key={o}>{o}</option>)}
              </select>
              <input value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} className="sk-input" placeholder="Expected quantity (e.g. 200 hampers)" />
              <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="sk-input" placeholder="Additional requirements" />
              <button className="sk-btn-primary w-full"><Send size={16} /> Submit Enquiry</button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
