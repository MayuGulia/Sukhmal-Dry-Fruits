import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, Building2, FileText, MessageCircle, Package, Send, ShieldCheck, Truck, Users,
} from 'lucide-react';
import { useHampers, HamperSkeleton } from '@/lib/catalog';
import { PremiumHamperCard } from '@/pages/GiftHampers';
import { CORP_PROMO_IMG } from '@/data/mockContent';
import { STORE_WHATSAPP } from '@/data/storeInfo';
import { api } from '@/lib/api';
import { isValidEmail, isValidIndianPhone, stripHtml } from '@/lib/security';

const PILLARS = [
  { Ic: Briefcase, t: 'Custom Branding', s: 'Logo, cards, ribbons & sleeves for your brand' },
  { Ic: FileText, t: 'GST Invoicing', s: 'Compliant B2B billing for every order' },
  { Ic: Truck, t: 'Pan-India Delivery', s: 'On-time despatch to 20,000+ pincodes' },
  { Ic: ShieldCheck, t: 'Bulk Discounts', s: 'Preferential pricing from 25 units' },
];

export default function Corporate() {
  const { data: hampers, loading } = useHampers();
  const list = hampers.filter((h) => h.tags.includes('Corporate') || h.tier === 'Premium');
  const show = list.length ? list : hampers;
  const [form, setForm] = useState({ name: '', phone: '', email: '', company: '', qty: '', notes: '' });
  const [sent, setSent] = useState(false);
  const [toast, setToast] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!stripHtml(form.name, 80) || !isValidIndianPhone(form.phone)) {
      setToast('Please enter a valid name and Indian mobile number.');
      setTimeout(() => setToast(''), 3500);
      return;
    }
    if (form.email && !isValidEmail(form.email)) {
      setToast('Please enter a valid email address.');
      setTimeout(() => setToast(''), 3500);
      return;
    }
    try {
      await api.post('/enquiry/bulk', {
        ...form,
        name: stripHtml(form.name, 80),
        notes: stripHtml(form.notes, 500),
        occasion: 'Corporate',
      });
    } catch {
      /* dummy OK */
    }
    setSent(true);
    setToast('Corporate enquiry received — proposal within 24 hours.');
    setTimeout(() => setToast(''), 3500);
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="bg-[var(--sk-cream-100)]">
      <section className="relative overflow-hidden min-h-[52vh] md:min-h-[58vh] flex items-center">
        <div className="absolute inset-0">
          <img
            src={CORP_PROMO_IMG || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=1800&auto=format&fit=crop&q=80'}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a120e]/92 via-[#2a1a12]/75 to-[#3C2415]/40" />
        </div>
        <div className="relative sk-container py-14 md:py-20 text-white">
          <p className="font-display italic text-[var(--sk-gold-300)] text-xl md:text-2xl">Corporate Gifting</p>
          <h1 className="font-display font-bold text-4xl md:text-5xl mt-1 max-w-2xl leading-tight">
            Premium Dry-Fruit Hampers for{' '}
            <span className="text-[var(--sk-gold-400)]">Teams & Clients</span>
          </h1>
          <p className="text-white/85 mt-4 max-w-xl md:text-lg">
            Elevate employee appreciation, client gifts, and festive gifting with branded packaging, GST invoices, and reliable bulk delivery.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#corp-form" className="inline-flex items-center gap-2 bg-white text-brand-900 font-semibold px-5 py-3 rounded-full hover:bg-cream-200 transition shadow-sk-sm">
              <Send size={16} /> Request a Proposal
            </a>
            <a
              href={`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent('Hi Sukhmal, corporate gifting enquiry')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border border-white/40 text-white font-semibold px-4 py-2.5 rounded-full text-sm hover:bg-white/10"
            >
              <MessageCircle size={16} /> WhatsApp Sales
            </a>
          </div>
        </div>
      </section>

      <div className="sk-container py-12 md:py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {PILLARS.map(({ Ic, t, s }) => (
            <div key={t} className="bg-white border border-line rounded-xl p-5 shadow-sk-sm text-center md:text-left">
              <Ic size={26} strokeWidth={1.4} className="mx-auto md:mx-0 text-[var(--sk-gold-500)]" />
              <div className="font-semibold text-brand-900 mt-3">{t}</div>
              <p className="text-[13px] text-ink-500 mt-1 leading-snug">{s}</p>
            </div>
          ))}
        </div>

        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <div className="sk-section-eyebrow">CURATED FOR BUSINESS</div>
            <h2 className="font-display font-bold text-brand-900 text-2xl md:text-4xl mt-1">Popular Corporate Hampers</h2>
          </div>
          <Link to="/gift-hampers" className="sk-btn-ghost text-sm hidden sm:inline-flex">View All →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <HamperSkeleton key={i} />)
            : show.slice(0, 4).map((h) => <PremiumHamperCard key={h.id} h={h} />)}
        </div>
      </div>

      <div className="bg-cream-200 border-y border-line" id="corp-form">
        <div className="sk-container py-14 md:py-20 grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <div className="sk-section-eyebrow">GET IN TOUCH</div>
            <h3 className="font-display font-bold text-brand-900 text-3xl mt-2">Ready to gift your team?</h3>
            <p className="text-ink-600 mt-3 max-w-md">
              Share your requirements and we’ll craft a branded proposal within 24 hours — complete with samples, timelines, and volume pricing.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                { Ic: Building2, t: 'Employee & client gifting programmes' },
                { Ic: Users, t: 'Festive / Diwali / New Year bulk drops' },
                { Ic: Package, t: 'Custom sleeves, inserts & QR cards' },
              ].map(({ Ic, t }) => (
                <li key={t} className="flex items-center gap-3 text-sm text-brand-900 font-medium">
                  <span className="h-9 w-9 rounded-full bg-white border border-line grid place-items-center text-gold-400">
                    <Ic size={16} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={submit} className="bg-white border border-line rounded-2xl p-6 md:p-8 shadow-sk-sm space-y-3">
            {sent ? (
              <div className="text-center py-10">
                <ShieldCheck size={36} className="mx-auto text-[var(--sk-green-500)]" />
                <div className="font-display font-bold text-brand-900 text-2xl mt-3">Enquiry sent</div>
                <p className="text-ink-600 mt-2 text-sm">Our corporate desk will reply within 24 hours.</p>
              </div>
            ) : (
              <>
                <div className="font-display font-bold text-brand-900 text-lg">Corporate Enquiry</div>
                <div className="grid md:grid-cols-2 gap-3">
                  <input required value={form.name} onChange={set('name')} className="sk-input" placeholder="Your name" />
                  <input required value={form.phone} onChange={set('phone')} className="sk-input" placeholder="Phone" />
                </div>
                <input type="email" value={form.email} onChange={set('email')} className="sk-input" placeholder="Work email" />
                <input value={form.company} onChange={set('company')} className="sk-input" placeholder="Company name" />
                <input value={form.qty} onChange={set('qty')} className="sk-input" placeholder="Expected quantity" />
                <textarea rows={3} value={form.notes} onChange={set('notes')} className="sk-input" placeholder="Occasion, branding notes, delivery city…" />
                <button type="submit" className="sk-btn-primary w-full !py-3.5">
                  <Send size={16} /> Submit Enquiry
                </button>
              </>
            )}
          </form>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] bg-brand-900 text-white text-sm font-medium px-5 py-3 rounded-full shadow-sk-lg max-w-[90vw] text-center">
          {toast}
        </div>
      )}
    </div>
  );
}
