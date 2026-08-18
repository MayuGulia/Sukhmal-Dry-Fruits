import React from 'react';
import { Link } from 'react-router-dom';
import { Award, ChevronRight, Gift, Leaf, ShieldCheck, Truck } from 'lucide-react';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { useHampers, HamperSkeleton } from '@/lib/catalog';
import { PremiumHamperCard } from '@/pages/GiftHampers';

function GoldFlourish({ mirror = false }) {
  return (
    <svg
      aria-hidden
      className={`text-[var(--sk-gold-500)] shrink-0 opacity-90 ${mirror ? 'scale-x-[-1]' : ''}`}
      width="44"
      height="14"
      viewBox="0 0 40 14"
      fill="none"
    >
      <path
        d="M1 7c5.5-6.5 11-6.5 18 0 7 6.5 12.5 6.5 20 0"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
      <circle cx="20" cy="7" r="2" fill="currentColor" />
      <circle cx="8" cy="7" r="1" fill="currentColor" opacity="0.55" />
      <circle cx="32" cy="7" r="1" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

const FESTIVAL_BLOCKS = [
  {
    key: 'diwali',
    name: 'Diwali',
    tag: 'Diwali',
    eyebrow: 'Celebrate the Festival of Lights',
    titleLead: 'Diwali',
    titleRest: 'Special Hampers',
    blurb: 'Light up your celebrations with our premium Diwali gift hampers.',
    quote: '“May this Diwali bring happiness, health and prosperity to you and your family.”',
    cta: 'Explore Diwali Gifts',
    hue: '#5B1F4A',
    titleColor: '#F0D78C',
    ghost: 'light',
    image: '/brand/festival-diwali-banner.png',
  },
  {
    key: 'rakhi',
    name: 'Rakhi',
    tag: 'Rakhi',
    eyebrow: 'A Bond of Love & Protection',
    titleLead: 'Rakhi',
    titleRest: 'Special Hampers',
    blurb: 'Show your love to your sibling with our thoughtfully curated Rakhi gifts.',
    quote: '“A small thread with a big promise of love and protection.”',
    cta: 'Explore Rakhi Gifts',
    hue: '#F6E4E0',
    titleColor: '#8B1E3F',
    restColor: '#C45C5C',
    textDark: true,
    ghost: 'dark',
    image: '/brand/festival-rakhi-banner.png',
  },
  {
    key: 'eid',
    name: 'Eid',
    tag: 'Eid',
    eyebrow: 'Share Joy & Blessings',
    titleLead: 'Eid',
    titleRest: 'Special Hampers',
    blurb: 'Celebrate Eid with our premium hampers filled with goodness.',
    quote: '“May this Eid bring peace, happiness and success to you and your family.”',
    cta: 'Explore Eid Gifts',
    hue: '#0F3D32',
    titleColor: '#E4C46A',
    ghost: 'light',
    image: '/brand/festival-eid-banner.png',
  },
  {
    key: 'christmas',
    name: 'Christmas',
    tag: 'Christmas',
    eyebrow: 'Joy, Love & Celebration',
    titleLead: 'Christmas',
    titleRest: 'Special Hampers',
    blurb: 'Share warmth and sweetness with premium Christmas hampers.',
    quote: '“Wishing you a Christmas filled with love, joy and sweet moments.”',
    cta: 'Explore Christmas Gifts',
    hue: '#7A1C24',
    titleColor: '#FFFFFF',
    ghost: 'light',
    image: '/brand/festival-christmas-banner.png',
  },
  {
    key: 'new-year',
    name: 'New Year',
    tag: 'New Year',
    eyebrow: 'New Beginnings, New Joys',
    titleLead: 'New Year',
    titleRest: 'Special Hampers',
    blurb: 'Welcome the New Year with health, happiness & sweet moments.',
    quote: '“Cheers to a new year and another chance for us to get it right.”',
    cta: 'Explore New Year Gifts',
    hue: '#121212',
    titleColor: '#E4C46A',
    ghost: 'light',
    image: '/brand/festival-newyear-banner.png',
  },
];

const FOOTER_TRUST = [
  { Ic: Award, label: 'Premium Quality' },
  { Ic: Leaf, label: 'Handpicked with Care' },
  { Ic: Gift, label: 'Elegant Packaging' },
  { Ic: Truck, label: 'Express Delivery' },
  { Ic: ShieldCheck, label: '100% Secure Payment' },
];

export default function Festival() {
  const { data: hampers, loading } = useHampers();

  return (
    <div className="bg-[var(--sk-cream-100)]">
      <div className="sk-container pt-6 md:pt-8 pb-2">
        <Breadcrumb items={[{ label: 'Festival Collections' }]} />
      </div>

      <div className="sk-container pt-4 pb-8 md:pb-10 text-center">
        <div className="flex items-center justify-center gap-3 md:gap-5 mb-3">
          <GoldFlourish />
          <h1 className="sk-section-title text-[1.85rem] md:text-[2.35rem] lg:text-[2.6rem] leading-tight tracking-[-0.02em]">
            Festival Collections
          </h1>
          <GoldFlourish mirror />
        </div>
        <p className="text-ink-600 max-w-2xl mx-auto text-sm md:text-base">
          Celebrate every festival with premium gift hampers made with love & the finest dry fruits.
        </p>
      </div>

      <div className="sk-container pb-12 md:pb-16 space-y-10 md:space-y-14">
        {FESTIVAL_BLOCKS.map((f) => {
          const match = hampers.filter((h) =>
            (h.tags || []).some((t) => t.toLowerCase() === f.tag.toLowerCase() || t.toLowerCase() === f.name.toLowerCase()),
          );
          const festivalTagged = hampers.filter((h) => (h.tags || []).includes('Festival'));
          const items = (match.length ? match : festivalTagged.length ? festivalTagged : hampers).slice(0, 4);
          const dark = !f.textDark;

          return (
            <section
              key={f.key}
              id={f.key}
              className="scroll-mt-24 bg-white rounded-2xl md:rounded-3xl shadow-sk-sm border border-line/60 p-4 md:p-6"
            >
              <div className="grid lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr] gap-5 md:gap-7 items-stretch">
                <div
                  className="relative rounded-2xl overflow-hidden min-h-[280px] md:min-h-[360px] flex flex-col justify-end p-6 md:p-7"
                  style={{ background: f.hue }}
                >
                  <img
                    src={f.image}
                    alt={`${f.name} dry fruit gift hampers`}
                    className={`absolute inset-0 w-full h-full object-cover ${dark ? 'opacity-45 mix-blend-luminosity' : 'opacity-55'}`}
                  />
                  <div
                    className={`absolute inset-0 ${
                      dark
                        ? 'bg-gradient-to-t from-black/75 via-black/35 to-black/15'
                        : 'bg-gradient-to-t from-[#F6E4E0]/95 via-[#F6E4E0]/55 to-transparent'
                    }`}
                  />
                  <div className={`relative ${dark ? 'text-white' : 'text-brand-900'}`}>
                    <div
                      className={`text-[11px] uppercase tracking-[0.16em] font-semibold ${
                        dark ? 'text-white/80' : 'text-[#8B1E3F]/80'
                      }`}
                    >
                      {f.eyebrow}
                    </div>
                    <h2 className="font-display font-bold text-2xl md:text-[1.85rem] mt-2 leading-tight">
                      <span style={{ color: f.titleColor }}>{f.titleLead}</span>{' '}
                      <span style={{ color: f.restColor || (dark ? '#fff' : f.titleColor) }}>{f.titleRest}</span>
                    </h2>
                    <p className={`text-sm mt-2.5 leading-relaxed ${dark ? 'text-white/88' : 'text-ink-700'}`}>
                      {f.blurb}
                    </p>
                    <p className={`text-sm italic mt-3 leading-relaxed font-display ${dark ? 'text-white/80' : 'text-ink-600'}`}>
                      {f.quote}
                    </p>
                    <Link
                      to="/gift-hampers"
                      className={`inline-flex items-center gap-1.5 mt-5 font-semibold text-sm px-4 py-2.5 rounded-lg transition ${
                        f.ghost === 'dark'
                          ? 'border border-[#8B1E3F] text-[#8B1E3F] hover:bg-[#8B1E3F] hover:text-white'
                          : 'border border-white/80 text-white hover:bg-white hover:text-brand-900'
                      }`}
                    >
                      {f.cta} <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h3 className="font-display font-bold text-brand-900 text-lg md:text-xl">
                      Best {f.name} Gift Hampers
                    </h3>
                    <Link
                      to="/gift-hampers"
                      className="text-sm font-semibold text-brand-900 hover:text-brand-700 inline-flex items-center gap-0.5 shrink-0"
                    >
                      View All {f.name} Gifts <ChevronRight size={14} />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 flex-1">
                    {loading
                      ? Array.from({ length: 4 }).map((_, i) => <HamperSkeleton key={i} />)
                      : items.map((h) => <PremiumHamperCard key={`${f.key}-${h.id}`} h={h} />)}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <div className="border-t border-line bg-white">
        <div className="sk-container py-10 grid grid-cols-2 md:grid-cols-5 gap-4">
          {FOOTER_TRUST.map(({ Ic, label }) => (
            <div key={label} className="flex flex-col items-center text-center gap-2 px-2">
              <div className="h-11 w-11 rounded-full bg-cream-300 text-[var(--sk-gold-500)] grid place-items-center">
                <Ic size={20} strokeWidth={1.5} />
              </div>
              <span className="text-[12px] md:text-sm font-semibold text-brand-900">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
