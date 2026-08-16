import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { POLICIES, FAQS } from '@/data/mockContent';
import { STORES } from '@/data/storeInfo';
import {
  MapPin, Phone, Clock, ChevronDown, ArrowRight, Home,
} from 'lucide-react';

export function StoreLocator() {
  return (
    <div>
      <div className="bg-cream-200 border-b border-line">
        <div className="sk-container py-8 md:py-12">
          <Breadcrumb items={[{ label: 'Store Locator' }]} />
          <div className="sk-section-eyebrow mt-4">FIND US</div>
          <h1 className="font-display font-bold text-brand-900 text-3xl md:text-5xl leading-tight mt-2">Our Stores</h1>
          <p className="text-ink-600 mt-2 max-w-xl text-sm md:text-base">
            Come say hi — visit a Sukhmal store for tastings, gifting advice, and freshly packed dry fruits.
          </p>
        </div>
      </div>
      <div className="sk-container py-10 md:py-14">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {STORES.map((s) => (
            <div key={s.name} className="sk-card overflow-hidden flex flex-col">
              <div className="aspect-[16/10] bg-cream-200">
                <img
                  src={s.photos?.[0] || '/brand/store-storefront.webp'}
                  alt={`${s.name} storefront`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="font-display font-bold text-brand-900 text-lg">{s.name}</div>
                <div className="text-sm text-ink-600 mt-2 flex items-start gap-1.5">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-brand-900" /> {s.address}
                </div>
                <div className="text-sm text-ink-600 mt-2 flex items-center gap-1.5">
                  <Phone size={14} className="text-brand-900" /> {s.phone}
                </div>
                <div className="text-[12px] text-ink-500 mt-1.5 flex items-center gap-1.5">
                  <Clock size={12} className="text-brand-900" /> {s.hours}
                </div>
                <a
                  href={s.directionsUrl || `https://maps.google.com/?q=${encodeURIComponent(s.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="sk-btn-outline mt-auto self-start mt-5 text-sm !py-2"
                >
                  <MapPin size={14} /> Get Directions
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PolicyPage({ pageKey }) {
  const key = pageKey || (typeof window !== 'undefined' ? window.location.pathname.slice(1) : 'privacy-policy');
  const doc = POLICIES[key] || POLICIES['privacy-policy'];
  return (
    <div>
      <div className="bg-cream-200 border-b border-line">
        <div className="sk-container py-8 md:py-12">
          <Breadcrumb items={[{ label: doc.title }]} />
          <h1 className="font-display font-bold text-brand-900 text-3xl md:text-4xl leading-tight mt-4">{doc.title}</h1>
          <p className="text-[12px] text-ink-500 mt-2">Last updated: January 2025</p>
        </div>
      </div>
      <div className="sk-container py-10 md:py-14 max-w-3xl">
        {doc.sections.map((s, i) => (
          <section key={s.h} className={`${i > 0 ? 'mt-8 pt-8 border-t border-line' : ''}`}>
            <h3 className="font-display text-xl font-bold text-brand-900 mb-2">{s.h}</h3>
            <p className="text-ink-600 leading-relaxed text-sm md:text-base">{s.p}</p>
          </section>
        ))}
        <div className="mt-10 pt-6 border-t border-line flex flex-wrap gap-3 text-sm">
          <Link to="/contact-us" className="sk-btn-ghost">Questions? Contact us <ArrowRight size={14} /></Link>
        </div>
      </div>
    </div>
  );
}

export function FAQs() {
  const [open, setOpen] = useState(-1);
  return (
    <div>
      <div className="bg-cream-200 border-b border-line">
        <div className="sk-container py-8 md:py-12">
          <Breadcrumb items={[{ label: 'FAQs' }]} />
          <div className="sk-section-eyebrow mt-4">HELP CENTRE</div>
          <h1 className="font-display font-bold text-brand-900 text-3xl md:text-5xl leading-tight mt-2">
            Frequently Asked Questions
          </h1>
          <p className="text-ink-600 mt-2 max-w-xl text-sm md:text-base">
            Quick answers on freshness, shipping, returns, gifting, and bulk orders.
          </p>
        </div>
      </div>
      <div className="sk-container py-10 md:py-14 max-w-3xl">
        <div className="space-y-2.5">
          {FAQS.map((f, i) => (
            <div key={f.q} className="sk-card bg-white">
              <button
                type="button"
                onClick={() => setOpen(open === i ? -1 : i)}
                className="w-full flex items-center justify-between gap-3 p-4 md:p-5 text-left"
                aria-expanded={open === i}
              >
                <span className="font-semibold text-brand-900 text-sm md:text-base">{f.q}</span>
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-ink-400 transition-transform ${open === i ? 'rotate-180' : ''}`}
                />
              </button>
              {open === i && (
                <div className="px-4 md:px-5 pb-4 md:pb-5 text-sm text-ink-600 leading-relaxed border-t border-line pt-3">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-10 sk-card p-6 bg-cream-300 text-center">
          <div className="font-display font-bold text-brand-900 text-xl">Still need help?</div>
          <p className="text-sm text-ink-600 mt-1">Our support team usually replies within a few hours.</p>
          <Link to="/contact-us" className="sk-btn-primary mt-4 inline-flex text-sm">
            Contact Us <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-cream-300 via-cream-100 to-cream-100" />
      <div className="relative sk-container py-20 md:py-28 text-center">
        <div className="sk-section-eyebrow">OOPS</div>
        <div className="font-display text-7xl md:text-9xl text-brand-900 font-bold leading-none mt-2">404</div>
        <div className="font-display text-2xl md:text-3xl mt-3 text-brand-900">Page not found</div>
        <p className="text-ink-600 mt-3 max-w-md mx-auto text-sm md:text-base">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back to something delicious.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="sk-btn-primary inline-flex">
            <Home size={16} /> Back to Home
          </Link>
          <Link to="/category/all" className="sk-btn-outline inline-flex">
            Shop Dry Fruits
          </Link>
        </div>
      </div>
    </div>
  );
}
