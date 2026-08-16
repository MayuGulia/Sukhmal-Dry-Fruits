import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumb from '@/components/shared/Breadcrumb';
import FlourishTitle from '@/components/home/FlourishTitle';
import { FAQS } from '@/data/mockContent';
import {
  MapPin, Phone, MessageCircle, Mail, Send, ChevronDown, ArrowRight,
  Lock, Tag, Package, Truck, Users, Play,
} from 'lucide-react';
import {
  STORE_ADDRESS, STORE_EMAIL, STORE_HOURS, STORE_MAPS_URL,
  STORE_PHONE_DISPLAY, STORE_PHONE_TEL, STORE_PHOTOS, STORE_WHATSAPP,
} from '@/data/storeInfo';

const STORE_GALLERY = [
  { src: STORE_PHOTOS[0], alt: 'Sukhmal Dry Fruits Korner storefront' },
  { src: STORE_PHOTOS[1], alt: "Roasted 'N' Salted wall inside the store" },
  { src: STORE_PHOTOS[2], alt: 'Hand Mixed Blends wall inside the store' },
];
const HERO_IMG = '/brand/contact-hero-hamper.png';
const BULK_IMG = '/brand/contact-bulk-hamper.png';

const CHANNELS = [
  {
    Ic: MapPin,
    title: 'Visit Store',
    lines: [STORE_ADDRESS],
    action: { label: 'Get Directions', href: STORE_MAPS_URL, external: true },
  },
  {
    Ic: Phone,
    title: 'Call Us',
    lines: [STORE_PHONE_DISPLAY, STORE_HOURS],
    action: { label: 'Call Now', href: `tel:${STORE_PHONE_TEL}` },
  },
  {
    Ic: MessageCircle,
    title: 'WhatsApp',
    lines: ['Quick Support', 'We usually reply within a few minutes'],
    action: { label: 'Chat Now', href: `https://wa.me/${STORE_WHATSAPP}`, external: true },
  },
  {
    Ic: Mail,
    title: 'Email Us',
    lines: [STORE_EMAIL, 'We reply within 24 hours'],
    action: { label: 'Send Email', href: `mailto:${STORE_EMAIL}` },
  },
];

const BULK_FEATURES = [
  { Ic: Tag, label: 'Custom Branding' },
  { Ic: Package, label: 'Personalized Packaging' },
  { Ic: Truck, label: 'PAN India Delivery' },
  { Ic: Users, label: 'Dedicated Relationship Manager' },
];

const CONTACT_FAQS = FAQS.slice(0, 6);

function StorePhotoGallery({ stacked = false }) {
  return (
    <div
      className={
        stacked
          ? 'flex md:flex-col gap-2 overflow-x-auto md:overflow-visible snap-x snap-mandatory scrollbar-none'
          : 'grid grid-cols-3 gap-2 md:gap-3'
      }
    >
      {STORE_GALLERY.map((p) => (
        <figure
          key={p.src}
          className={
            stacked
              ? 'min-w-[78%] sm:min-w-[60%] md:min-w-0 snap-center rounded-2xl overflow-hidden border border-line shadow-[var(--sk-shadow-md)] aspect-[4/3] md:aspect-[16/10] bg-cream-200'
              : 'rounded-xl overflow-hidden border border-line aspect-[4/3] bg-cream-200 shadow-[var(--sk-shadow-sm)]'
          }
        >
          <img
            src={p.src}
            alt={p.alt}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </figure>
      ))}
    </div>
  );
}

export default function Contact() {
  const [form, setForm] = useState({
    first: '', last: '', email: '', phone: '', subject: '',
    qtype: 'General', orderId: '', msg: '', consent: false,
  });
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState(-1);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.consent) {
      alert('Please accept the privacy policy.');
      return;
    }
    setSent(true);
  };

  return (
    <div className="bg-cream-100">
      {/* HERO */}
      <section className="bg-cream-200 border-b border-line">
        <div className="sk-container py-10 md:py-14 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <Breadcrumb items={[{ label: 'Contact Us' }]} />
            <h1 className="font-display font-bold text-brand-900 text-3xl md:text-5xl leading-tight mt-4">
              Contact Our Team
            </h1>
            <p className="font-display italic text-[var(--sk-gold-400)] text-xl md:text-2xl mt-2">
              We&apos;d Love to Hear From You
            </p>
            <p className="text-ink-600 mt-4 max-w-lg text-sm md:text-base leading-relaxed">
              Whether you need help with an order, want premium dry fruits for home, or are planning
              bulk &amp; corporate gifting — our team is here to help.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <a href="#message" className="sk-btn-primary">
                Contact Support <ArrowRight size={16} />
              </a>
              <a href="#store" className="sk-btn-outline">Visit Store</a>
            </div>
          </div>
          <div className="relative">
            <img
              src={HERO_IMG}
              alt="Sukhmal luxury gift hamper"
              className="w-full h-[260px] md:h-[360px] object-cover rounded-2xl border border-line shadow-[var(--sk-shadow-lg)]"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-14 w-14 rounded-full bg-white/90 text-brand-900 grid place-items-center shadow-[var(--sk-shadow-md)]">
                <Play size={22} fill="currentColor" className="ml-0.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHANNEL CARDS */}
      <section className="sk-container py-10 md:py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CHANNELS.map(({ Ic, title, lines, action }) => (
            <div key={title} className="bg-white border border-line rounded-xl p-5 md:p-6 flex flex-col shadow-[var(--sk-shadow-sm)]">
              <div className="h-11 w-11 rounded-full bg-cream-300 text-brand-900 grid place-items-center">
                <Ic size={20} strokeWidth={1.75} />
              </div>
              <div className="font-display font-bold text-brand-900 text-lg mt-3">{title}</div>
              {lines.map((line) => (
                <div key={line} className="text-[12px] text-ink-600 mt-1 leading-snug">{line}</div>
              ))}
              <a
                href={action.href}
                target={action.external ? '_blank' : undefined}
                rel={action.external ? 'noreferrer' : undefined}
                className="mt-auto pt-4 text-sm font-semibold text-brand-900 inline-flex items-center gap-1 hover:text-[var(--sk-brown-700)]"
              >
                {action.label} <ArrowRight size={14} />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* STORE PHOTO GALLERY + FORM */}
      <section id="message" className="sk-container pb-14 md:pb-20">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-stretch">
          <StorePhotoGallery stacked />

          <form onSubmit={submit} className="bg-white border border-line rounded-2xl p-6 md:p-8 space-y-3.5 shadow-[var(--sk-shadow-md)]">
            {sent ? (
              <div className="text-center py-12">
                <div className="font-display font-bold text-brand-900 text-2xl md:text-3xl">Thank you!</div>
                <p className="text-ink-600 mt-2">We&apos;ll get back within 24 hours.</p>
                <button type="button" onClick={() => setSent(false)} className="sk-btn-outline mt-5 text-sm">
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <div>
                  <div className="sk-section-eyebrow">GET IN TOUCH</div>
                  <h2 className="sk-section-title text-2xl md:text-3xl mt-1.5">Send Us a Message</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-ink-500 mb-1 block">First Name *</label>
                    <input required value={form.first} onChange={set('first')} className="sk-input" placeholder="First name" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-ink-500 mb-1 block">Last Name *</label>
                    <input required value={form.last} onChange={set('last')} className="sk-input" placeholder="Last name" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-ink-500 mb-1 block">Email *</label>
                    <input required type="email" value={form.email} onChange={set('email')} className="sk-input" placeholder="you@email.com" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-ink-500 mb-1 block">Phone Number *</label>
                    <input required value={form.phone} onChange={set('phone')} className="sk-input" placeholder="+91" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-ink-500 mb-1 block">Subject *</label>
                    <input required value={form.subject} onChange={set('subject')} className="sk-input" placeholder="How can we help?" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-ink-500 mb-1 block">Query Type *</label>
                    <select required value={form.qtype} onChange={set('qtype')} className="sk-input">
                      {['General', 'Order Inquiry', 'Bulk Order', 'Feedback', 'Partnership'].map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-500 mb-1 block">Order ID (Optional)</label>
                  <input value={form.orderId} onChange={set('orderId')} className="sk-input" placeholder="e.g. SKH-10234" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-500 mb-1 block">Message *</label>
                  <textarea required rows={4} value={form.msg} onChange={set('msg')} className="sk-input" placeholder="Your message" />
                </div>
                <label className="flex items-start gap-2 text-[12px] text-ink-600 cursor-pointer">
                  <input type="checkbox" checked={form.consent} onChange={set('consent')} className="mt-0.5 accent-[var(--sk-brown-900)]" />
                  <span>
                    I agree to the{' '}
                    <Link to="/privacy-policy" className="font-semibold text-brand-900 underline underline-offset-2">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
                <button type="submit" className="sk-btn-primary w-full">
                  <Send size={16} /> Send Message
                </button>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-ink-400 pt-1">
                  <Lock size={12} /> Your information is protected with SSL encryption.
                </div>
              </>
            )}
          </form>
        </div>
      </section>

      {/* BULK CTA */}
      <section className="bg-cream-200 border-y border-line">
        <div className="sk-container py-12 md:py-16 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="sk-section-title text-3xl md:text-4xl">Planning Bulk Orders?</h2>
            <p className="text-ink-600 mt-3 max-w-lg text-sm md:text-base">
              Exclusive solutions for weddings, corporate events, and celebration gifting —
              custom branding, packaging, and pan-India delivery with a dedicated manager.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {BULK_FEATURES.map(({ Ic, label }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-white border border-line grid place-items-center text-brand-900">
                    <Ic size={16} />
                  </div>
                  <span className="text-sm font-semibold text-brand-900">{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link to="/wedding-gifts#form" className="sk-btn-primary">
                Request Bulk Order <ArrowRight size={16} />
              </Link>
              <a
                href={`https://wa.me/${STORE_WHATSAPP}`}
                target="_blank"
                rel="noreferrer"
                className="sk-btn-outline !text-[var(--sk-green-500)] !border-[var(--sk-green-500)]"
              >
                <MessageCircle size={16} /> Chat on WhatsApp
              </a>
            </div>
          </div>
          <img
            src={BULK_IMG}
            alt="Bulk gift packaging"
            className="w-full h-[260px] md:h-[340px] object-cover rounded-2xl border border-line shadow-[var(--sk-shadow-md)]"
          />
        </div>
      </section>

      {/* STORE CARD — no Maps embed */}
      <section id="store" className="sk-container py-14 md:py-20">
        <FlourishTitle title="Visit Our Store" />
        <div className="-mt-2 space-y-5">
          <StorePhotoGallery />
          <div className="bg-white border border-line rounded-xl p-6 md:p-8 flex flex-col shadow-[var(--sk-shadow-sm)] max-w-xl">
            <div className="font-display font-bold text-brand-900 text-xl">Sukhmal Dry Fruits Korner</div>
            <div className="mt-4 space-y-3 text-sm text-ink-600">
              <div className="flex gap-2.5">
                <MapPin size={16} className="shrink-0 mt-0.5 text-brand-900" />
                <span>{STORE_ADDRESS}</span>
              </div>
              <div className="flex gap-2.5">
                <Phone size={16} className="shrink-0 mt-0.5 text-brand-900" />
                <a href={`tel:${STORE_PHONE_TEL}`} className="hover:underline">{STORE_PHONE_DISPLAY}</a>
              </div>
              <div className="flex gap-2.5">
                <Mail size={16} className="shrink-0 mt-0.5 text-brand-900" />
                <a href={`mailto:${STORE_EMAIL}`} className="hover:underline">{STORE_EMAIL}</a>
              </div>
              <div>
                <div className="font-semibold text-brand-900 mb-1">Opening Hours</div>
                <div>{STORE_HOURS}</div>
              </div>
            </div>
            <a
              href={STORE_MAPS_URL}
              target="_blank"
              rel="noreferrer"
              className="sk-btn-primary mt-auto self-start"
            >
              <MapPin size={16} /> Get Directions
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-cream-200 border-t border-line py-14 md:py-16">
        <div className="sk-container">
          <FlourishTitle title="Frequently Asked Questions" />
          <div className="grid md:grid-cols-2 gap-3 max-w-5xl mx-auto -mt-2">
            {CONTACT_FAQS.map((f, i) => (
              <div key={f.q} className="bg-white border border-line rounded-xl shadow-[var(--sk-shadow-sm)]">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left"
                  aria-expanded={openFaq === i}
                >
                  <span className="font-semibold text-brand-900 text-sm md:text-[15px]">{f.q}</span>
                  <ChevronDown size={16} className={`shrink-0 text-ink-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-ink-600 leading-relaxed border-t border-line pt-3">{f.a}</div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link to="/faqs" className="sk-btn-ghost text-sm">
              View all FAQs <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
