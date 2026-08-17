import React from 'react';
import { Link } from 'react-router-dom';
import Breadcrumb from '@/components/shared/Breadcrumb';
import FlourishTitle from '@/components/home/FlourishTitle';
import {
  Leaf, Award, Heart, Hand, Users, TrendingUp, Package,
  Search, Sparkles, Box, ClipboardCheck, ArrowRight,
} from 'lucide-react';

const HERO_IMG = '/brand/about-hero-family.png';
const FOUNDER_IMG = '/brand/about-founder-portrait.png';
const QUOTE_IMG = '/brand/about-quote-nuts.png';
const CTA_IMG = '/brand/about-thankyou-nuts.png';

const PROCESS_IMGS = [
  '/brand/about-process-sorting.png',
  '/brand/about-process-hands.png',
  '/brand/about-process-packaging.png',
  '/brand/about-process-quality.png',
];

const TIMELINE = [
  { year: '2010', title: 'The Beginning', text: 'Opened our first small store with a passion for pure dry fruits.' },
  { year: '2013', title: 'Premium Sourcing', text: 'Began importing premium dry fruits from trusted global origins.' },
  { year: '2016', title: 'Expanding Love', text: 'Grew the assortment with more varieties families love.' },
  { year: '2018', title: 'Gift Hampers', text: 'Introduced handcrafted hampers for celebrations & gifting.' },
  { year: '2021', title: 'Pan India Delivery', text: 'Scaled logistics to deliver freshness across India.' },
  { year: '2023', title: 'Corporate Gifting', text: 'Became a trusted partner for corporate & bulk gifting.' },
  { year: '2025', title: 'The Future', text: 'Innovating with care — D2C experience, quality-first always.' },
];

const STATS = [
  { Ic: TrendingUp, n: '30+', l: 'Years of Trust' },
  { Ic: Users, n: '20K+', l: 'Happy Customers' },
  { Ic: Award, n: '500+', l: 'Corporate Clients' },
  { Ic: Package, n: '150+', l: 'Products' },
  { Ic: Heart, n: '99%', l: 'Customer Satisfaction' },
];

const HERO_ICONS = [
  { Ic: Leaf, label: '100% Natural' },
  { Ic: Award, label: 'Premium Quality' },
  { Ic: Hand, label: 'Handpicked' },
  { Ic: Heart, label: 'Made with Love' },
];

const PROCESS_STEPS = [
  { Ic: Search, title: 'Careful Sorting', text: 'Hand-sorted for size, colour, and purity.' },
  { Ic: Sparkles, title: 'Hygienic Processing', text: 'Clean, controlled facility handling.' },
  { Ic: Box, title: 'Premium Packaging', text: 'Sealed to lock in freshness & aroma.' },
  { Ic: ClipboardCheck, title: 'Quality Inspection', text: 'Batch-tested before every dispatch.' },
];

export default function About() {
  return (
    <div className="bg-cream-100">
      {/* HERO */}
      <section className="relative overflow-hidden bg-cream-200 border-b border-line">
        <div className="sk-container py-10 md:py-16 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <Breadcrumb items={[{ label: 'About Us' }]} />
            <div className="sk-section-eyebrow mt-4">ABOUT SUKHMAL</div>
            <h1 className="font-display font-bold text-brand-900 text-3xl md:text-5xl leading-tight mt-2">
              Premium Quality. Timeless Trust. Crafted with Love.
            </h1>
            <p className="text-ink-600 mt-4 max-w-xl text-sm md:text-base leading-relaxed">
              From a small neighbourhood store to a trusted name in dry fruits and gifting —
              Sukhmal Dry Fruits Korner has grown on one promise: purity you can taste,
              freshness you can trust, and hampers crafted with heart.
            </p>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {HERO_ICONS.map(({ Ic, label }) => (
                <div key={label} className="flex flex-col items-start gap-2">
                  <div className="h-11 w-11 rounded-full bg-white border border-line grid place-items-center text-[var(--sk-gold-400)] shadow-[var(--sk-shadow-sm)]">
                    <Ic size={18} strokeWidth={1.75} />
                  </div>
                  <span className="text-[12px] md:text-sm font-semibold text-brand-900 leading-snug">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <img
              src={HERO_IMG}
              alt="Sukhmal family with gift hampers"
              className="w-full h-[280px] md:h-[420px] object-cover rounded-2xl shadow-[var(--sk-shadow-lg)] border border-line"
            />
          </div>
        </div>
      </section>

      {/* FOUNDER STORY */}
      <section className="sk-container py-14 md:py-20">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <div className="lg:col-span-4">
            <img
              src={FOUNDER_IMG}
              alt="Saurabh Malhotra, Founder"
              className="w-full h-full min-h-[320px] object-cover rounded-2xl border border-line shadow-[var(--sk-shadow-md)]"
            />
          </div>
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="sk-section-eyebrow">FOUNDER&apos;S NOTE</div>
            <h2 className="sk-section-title text-3xl md:text-4xl mt-2">A Dream Rooted in Passion</h2>
            <p className="text-ink-600 mt-4 leading-relaxed">
              Sukhmal was born from a simple belief — that every family deserves access to the
              freshest, purest dry fruits, sourced with honesty and packed with care. What began
              as a small shop has become a promise we renew with every order.
            </p>
            <p className="text-ink-600 mt-3 leading-relaxed">
              Purity, freshness, and trust aren&apos;t marketing words for us. They are how we
              source, sort, pack, and ship — every single day.
            </p>
            <div className="mt-6 pt-4 border-t border-line">
              <div className="font-display text-2xl italic text-brand-900" style={{ fontFamily: 'cursive, "Playfair Display", serif' }}>
                Saurabh Malhotra
              </div>
              <div className="text-[12px] text-ink-500 mt-0.5">Founder, Sukhmal Dry Fruits Korner</div>
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="h-full rounded-2xl bg-brand-900 text-white p-6 md:p-7 flex flex-col justify-between shadow-[var(--sk-shadow-lg)]">
              <div>
                <div className="font-display text-5xl text-gold-300 leading-none">&ldquo;</div>
                <p className="font-display text-xl md:text-2xl leading-snug mt-2">
                  Our mission is to deliver purity, quality and smiles in every pack we send.
                </p>
              </div>
              <img src={QUOTE_IMG} alt="Premium Sukhmal nuts in a bowl" className="mt-6 w-full h-28 object-cover rounded-xl opacity-90" />
            </div>
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="bg-cream-200 py-14 md:py-20 border-y border-line">
        <div className="sk-container">
          <FlourishTitle title="Our Journey" />
          <p className="text-center text-ink-600 -mt-4 mb-10 md:mb-14 text-sm md:text-base max-w-xl mx-auto">
            From a neighbourhood store to pan-India gifting — 2010 to 2025.
          </p>

          <div className="hidden lg:block relative">
            <div className="absolute left-0 right-0 top-8 border-t-2 border-dashed border-[var(--sk-gold-500)]" />
            <div className="grid grid-cols-7 gap-3 relative">
              {TIMELINE.map((t) => (
                <div key={t.year} className="text-center pt-2">
                  <div className="mx-auto h-4 w-4 rounded-full bg-[var(--sk-gold-500)] ring-4 ring-cream-200 mb-4" />
                  <div className="font-display font-bold text-brand-900 text-2xl">{t.year}</div>
                  <div className="font-semibold text-brand-900 text-sm mt-1">{t.title}</div>
                  <p className="text-[11px] text-ink-500 mt-1.5 leading-snug px-1">{t.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:hidden relative pl-8">
            <div className="absolute left-3 top-0 bottom-0 w-[2px] bg-[var(--sk-gold-500)]" />
            <div className="space-y-6">
              {TIMELINE.map((t) => (
                <div key={t.year} className="relative">
                  <div className="absolute -left-8 top-1.5 w-4 h-4 rounded-full bg-[var(--sk-gold-500)] ring-4 ring-cream-200" />
                  <div className="bg-white border border-line rounded-xl p-4 shadow-[var(--sk-shadow-sm)]">
                    <div className="font-display text-2xl font-bold text-brand-900">{t.year}</div>
                    <div className="font-semibold text-brand-900">{t.title}</div>
                    <p className="text-sm text-ink-600 mt-1">{t.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MANUFACTURING */}
      <section className="sk-container py-14 md:py-20">
        <FlourishTitle title="Pure Process. Perfect Quality." />
        <p className="text-center text-ink-600 -mt-4 mb-10 text-sm md:text-base max-w-xl mx-auto">
          Hygienic handling from sort to seal — so every bite stays as fresh as the day it arrived.
        </p>
        <div className="grid md:grid-cols-2 gap-3 md:gap-4 mb-8">
          {PROCESS_IMGS.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={`Manufacturing step ${i + 1}`}
              className="w-full h-40 md:h-52 object-cover rounded-2xl border border-line"
              loading="lazy"
            />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PROCESS_STEPS.map(({ Ic, title, text }) => (
            <div key={title} className="bg-white border border-line rounded-xl p-5 text-center shadow-[var(--sk-shadow-sm)]">
              <div className="mx-auto h-12 w-12 rounded-full bg-cream-300 text-brand-900 grid place-items-center">
                <Ic size={22} strokeWidth={1.75} />
              </div>
              <div className="font-display font-bold text-brand-900 mt-3">{title}</div>
              <p className="text-[12px] text-ink-500 mt-1">{text}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/faqs" className="sk-btn-primary">
            Know More About Our Process <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-brand-900 text-white py-12 md:py-14">
        <div className="sk-container">
          <div className="text-center mb-8">
            <div className="sk-section-eyebrow !text-gold-300">SUKHMAL IN NUMBERS</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4">
            {STATS.map(({ Ic, n, l }) => (
              <div key={l} className="text-center">
                <Ic size={26} className="mx-auto text-gold-300" strokeWidth={1.5} />
                <div className="font-display font-bold text-3xl md:text-4xl mt-2">{n}</div>
                <div className="text-[12px] md:text-sm opacity-80 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={CTA_IMG} alt="Thank-you dry fruit assortment from Sukhmal" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-brand-900/85" />
        </div>
        <div className="relative sk-container py-16 md:py-20 text-center text-white">
          <h2 className="font-display font-bold text-3xl md:text-4xl max-w-3xl mx-auto leading-tight">
            Thank You for Being a Part of Our Journey
          </h2>
          <p className="mt-4 text-cream-200/90 max-w-xl mx-auto text-sm md:text-base">
            We promise to continue delivering purity, quality and happiness in every bite.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/category/all" className="sk-btn-gold">Shop Dry Fruits</Link>
            <Link to="/contact-us" className="sk-btn-outline !bg-white/10 !border-white/40 !text-white">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
