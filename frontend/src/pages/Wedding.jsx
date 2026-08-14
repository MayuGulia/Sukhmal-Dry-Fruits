import React, { useRef, useState } from 'react';
import {
  Award, ChevronLeft, ChevronRight, Gift, Heart, Instagram, MapPin, Maximize2,
  MessageCircle, Package, Pause, Play, Send, ShieldCheck, Sparkles, Truck, Users, Volume2,
} from 'lucide-react';
import FlourishTitle from '@/components/home/FlourishTitle';
import { INSTAGRAM_POSTS, WEDDING_PROMO_IMG } from '@/data/mockContent';
import { api } from '@/lib/api';

const BULK_GIFT_IMG = '/brand/wedding-bulk-gift.png';

const TRUST_5 = [
  { Ic: Award, t: 'Finest Ingredients', s: 'Handpicked premium nuts & dry fruits.' },
  { Ic: Sparkles, t: 'Customizable Hampers', s: 'Create hampers as unique as your celebrations.' },
  { Ic: Package, t: 'Elegant & Luxurious', s: 'Exquisite packaging that leaves a lasting impression.' },
  { Ic: Heart, t: 'Perfect for Every Occasion', s: 'Weddings, Engagements, Sangeet & more.' },
  { Ic: Users, t: 'Trusted by Thousands', s: 'Preferred choice for memorable gifting.' },
];

const HERO_ICONS = [
  { Ic: Award, label: 'Premium Quality', sub: 'Finest Selection' },
  { Ic: Gift, label: 'Elegant Packaging', sub: 'Perfect for Gifting' },
  { Ic: Truck, label: 'Timely Delivery', sub: 'Across India' },
  { Ic: Heart, label: 'Made with Love', sub: 'Handpicked Care' },
];

const BULK_PERKS = [
  { Ic: ShieldCheck, t: 'Best Bulk Pricing' },
  { Ic: Gift, t: 'Personalized Packaging' },
  { Ic: MapPin, t: 'On-time Delivery Across India' },
];

const OCCASIONS = ['Wedding', 'Reception', 'Sangeet', 'Engagement', 'Anniversary', 'Other'];

export default function Wedding() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', occasion: 'Wedding', qty: '', notes: '' });
  const [toast, setToast] = useState('');
  const [sent, setSent] = useState(false);
  const [playing, setPlaying] = useState(false);
  const igRef = useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/enquiry/bulk', form);
    } catch {
      /* dummy OK */
    }
    setSent(true);
    setToast('Bulk enquiry submitted — we’ll reach out shortly.');
    setTimeout(() => setToast(''), 3500);
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const scrollIg = (dir) => {
    const el = igRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 220, behavior: 'smooth' });
  };

  return (
    <div className="bg-[var(--sk-cream-100)]">
      {/* Hero — full-bleed lifestyle + video chrome */}
      <section className="relative overflow-hidden min-h-[72vh] md:min-h-[82vh] flex items-end md:items-center">
        <div className="absolute inset-0">
          <img
            src={WEDDING_PROMO_IMG}
            alt="Sukhmal wedding gift hamper"
            className="w-full h-full object-cover object-center scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a120e]/92 via-[#2a1a12]/72 to-[#3C2415]/28" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a120e]/55 via-transparent to-[#1a120e]/25" />
        </div>

        <div className="relative sk-container w-full pt-16 pb-20 md:py-24">
          <div className="max-w-xl text-white">
            <p className="font-display italic text-[var(--sk-gold-300)] text-xl md:text-2xl tracking-wide">
              Celebrate Love with
            </p>
            <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-[3.4rem] leading-[1.12] mt-1">
              Thoughtful{' '}
              <span className="text-[var(--sk-gold-400)]">Wedding Gifts</span>
            </h1>
            <p className="mt-4 text-white/85 max-w-md md:text-[1.05rem] leading-relaxed">
              Premium dry fruits & handcrafted hampers that make every celebration unforgettable.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-x-5 gap-y-4 max-w-lg">
              {HERO_ICONS.map(({ Ic, label, sub }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <Ic size={18} strokeWidth={1.5} className="text-white/95 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[13px] font-semibold leading-tight">{label}</div>
                    <div className="text-[11px] text-white/65 mt-0.5">{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#bulk"
                className="inline-flex items-center gap-2 bg-white text-brand-900 font-semibold px-6 py-3 rounded-full hover:bg-cream-200 transition shadow-sk-sm"
              >
                Explore Wedding Hampers →
              </a>
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                className="inline-flex items-center gap-2.5 text-white/90 text-sm hover:text-white transition"
              >
                <span className="h-10 w-10 rounded-full border border-white/45 grid place-items-center bg-white/5 backdrop-blur-sm">
                  {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                </span>
                See how we craft the perfect wedding gifts
              </button>
            </div>
          </div>
        </div>

        {/* Video chrome bar */}
        <div className="absolute inset-x-0 bottom-0 px-4 md:px-8 pb-3">
          <div className="max-w-5xl mx-auto">
            <div className="h-[3px] rounded-full bg-white/25 overflow-hidden">
              <div
                className="h-full bg-[var(--sk-gold-400)] transition-all duration-500"
                style={{ width: playing ? '45%' : '18%' }}
              />
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-white/80 text-[11px]">
              <button type="button" onClick={() => setPlaying((p) => !p)} className="hover:text-white" aria-label="Play">
                {playing ? <Pause size={12} /> : <Play size={12} />}
              </button>
              <Volume2 size={12} />
              <span className="tabular-nums">{playing ? '0:14' : '0:08'} / 0:30</span>
              <span className="ml-auto"><Maximize2 size={12} /></span>
            </div>
          </div>
        </div>
      </section>

      {/* Why Sukhmal — rounded white panel overlapping hero */}
      <div className="relative -mt-6 md:-mt-10 z-10">
        <div className="sk-container">
          <div className="bg-white rounded-t-[28px] md:rounded-t-[40px] rounded-b-2xl shadow-sk-md px-4 md:px-10 pt-10 md:pt-14 pb-10 md:pb-12">
            <FlourishTitle title="Why Sukhmal Wedding Gifts?" className="!mb-8 md:!mb-10" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4">
              {TRUST_5.map(({ Ic, t, s }) => (
                <div key={t} className="text-center px-1">
                  <Ic size={28} strokeWidth={1.35} className="mx-auto text-[var(--sk-gold-500)]" />
                  <div className="font-semibold text-brand-900 mt-3 text-sm md:text-[15px] leading-snug">{t}</div>
                  <p className="text-[12px] text-ink-500 mt-1.5 leading-snug">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bulk order */}
      <div className="sk-container py-10 md:py-14" id="bulk">
        <div className="bg-[#F7F3EC] rounded-2xl md:rounded-3xl p-6 md:p-10 shadow-sk-sm">
          <div className="grid lg:grid-cols-[1fr_1.15fr_0.9fr] gap-8 lg:gap-10 items-start">
            <div>
              <h2 className="font-display font-bold text-brand-900 text-2xl md:text-[1.75rem] leading-tight">
                Planning a Big Celebration?
              </h2>
              <div className="font-display font-bold text-[var(--sk-gold-500)] text-3xl md:text-4xl mt-1">
                Order in Bulk
              </div>
              <p className="text-ink-600 mt-3 text-sm md:text-[15px] leading-relaxed">
                Get custom hampers for weddings & events at special bulk prices.
              </p>
              <ul className="mt-5 space-y-3">
                {BULK_PERKS.map(({ Ic, t }) => (
                  <li key={t} className="flex items-center gap-2.5 text-sm text-brand-900 font-semibold">
                    <Ic size={18} strokeWidth={1.5} className="text-[var(--sk-gold-500)] shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="https://wa.me/919876543210?text=Hi%20Sukhmal%2C%20I%27d%20like%20a%20wedding%20bulk%20quote"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] text-white font-semibold px-4 py-2.5 rounded-lg text-sm hover:opacity-95 shadow-sk-sm"
                >
                  <MessageCircle size={16} /> Chat on WhatsApp
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-white border border-[var(--sk-gold-500)] text-brand-900 font-semibold px-4 py-2.5 rounded-lg text-sm hover:bg-cream-200"
                >
                  <Instagram size={16} /> DM us on Instagram
                </a>
              </div>
            </div>

            <form onSubmit={submit} className="bg-white border border-line rounded-2xl p-5 md:p-7 shadow-sk-md space-y-3">
              <div className="font-display font-bold text-brand-900 text-xl">Request Bulk Order</div>
              <p className="text-[13px] text-ink-500 -mt-1">Fill out the details and our team will get in touch with you.</p>
              {sent ? (
                <div className="text-center py-10">
                  <ShieldCheck size={36} className="mx-auto text-[var(--sk-green-500)]" />
                  <div className="font-display font-bold text-brand-900 text-2xl mt-3">Thank you!</div>
                  <p className="text-ink-600 mt-2 text-sm">A wedding coordinator will reach out within 2 business hours.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSent(false);
                      setForm({ name: '', phone: '', email: '', occasion: 'Wedding', qty: '', notes: '' });
                    }}
                    className="sk-btn-outline mt-5 text-sm"
                  >
                    Submit another
                  </button>
                </div>
              ) : (
                <>
                  <input required value={form.name} onChange={set('name')} className="sk-input" placeholder="Your Name" />
                  <input required value={form.phone} onChange={set('phone')} className="sk-input" placeholder="Phone Number" />
                  <input type="email" value={form.email} onChange={set('email')} className="sk-input" placeholder="Email Address" />
                  <select value={form.occasion} onChange={set('occasion')} className="sk-input">
                    {OCCASIONS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                  <input value={form.qty} onChange={set('qty')} className="sk-input" placeholder="Expected Quantity" />
                  <textarea rows={3} value={form.notes} onChange={set('notes')} className="sk-input" placeholder="Additional Requirements (Optional)" />
                  <button type="submit" className="sk-btn-primary w-full !py-3.5 !rounded-xl">
                    Submit Request <Send size={16} />
                  </button>
                </>
              )}
            </form>

            <div className="hidden lg:block rounded-2xl overflow-hidden aspect-square bg-cream-300 shadow-sk-sm">
              <img
                src={BULK_GIFT_IMG}
                alt="Premium wedding gift box"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Find Inspiration */}
      <div className="sk-container pb-14 md:pb-20">
        <div className="text-center mb-8">
          <FlourishTitle title="Find Inspiration" className="!mb-3" />
          <p className="text-ink-600 text-sm inline-flex flex-wrap items-center justify-center gap-2">
            Follow us on Instagram for more gifting ideas
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#F3E5D7] text-[#C45C26] font-semibold text-[13px]">
              @sukhmaldryfruits
            </span>
          </p>
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollIg(-1)}
            className="hidden md:grid absolute -left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 place-items-center rounded-full bg-white border border-line shadow-sk-sm text-ink-500 hover:text-brand-900"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollIg(1)}
            className="hidden md:grid absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 place-items-center rounded-full bg-white border border-line shadow-sk-sm text-ink-500 hover:text-brand-900"
          >
            <ChevronRight size={18} />
          </button>

          <div ref={igRef} className="flex gap-3 md:gap-4 overflow-x-auto pb-2 sk-scroll-x scrollbar-none px-1">
            {(INSTAGRAM_POSTS || []).slice(0, 5).map((src, i) => (
              <a
                key={i}
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="shrink-0 w-44 h-44 md:w-52 md:h-52 rounded-xl overflow-hidden shadow-sk-sm"
              >
                <img src={src} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </a>
            ))}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="shrink-0 w-44 h-44 md:w-52 md:h-52 rounded-xl bg-white border border-line shadow-sk-sm grid place-items-center text-center p-5 hover:border-brand-900 transition"
            >
              <div>
                <Instagram size={28} className="mx-auto text-brand-900" />
                <div className="font-semibold text-brand-900 text-sm mt-2.5 leading-snug">
                  Follow Us on Instagram →
                </div>
              </div>
            </a>
          </div>
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
