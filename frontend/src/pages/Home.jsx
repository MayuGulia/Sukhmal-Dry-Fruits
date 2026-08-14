import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight, Wand2, MessageSquare, Star, ShieldCheck,
  Award, Leaf, Package, Truck, HeartHandshake, Sparkles, Search, Send, Instagram,
} from 'lucide-react';
import ProductCard, { TrustStrip } from '@/components/shared/ProductCard';
import FlourishTitle from '@/components/home/FlourishTitle';
import ScrollRow from '@/components/home/ScrollRow';
import { useProducts, ProductSkeleton } from '@/lib/catalog';
import { TESTIMONIALS } from '@/data/mockContent';
import {
  SHOP_CATEGORY_TILES,
  FESTIVAL_TILES,
  INSTAGRAM_POSTS,
  WHY_CHOOSE,
  AI_PREVIEW_IMG,
  BYOH_BANNER_IMG,
  WEDDING_PROMO_IMG,
  CORP_PROMO_IMG,
  HERO_IMG,
} from '@/data/homeBrand';

const WHY_ICONS = {
  trust: Award,
  natural: Leaf,
  quality: Star,
  hygiene: Package,
  delivery: Truck,
  love: HeartHandshake,
};

function ViewAllLink({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--sk-gold-500)] hover:text-[var(--sk-brown-700)] transition-colors"
    >
      {children} <ChevronRight size={14} strokeWidth={2.25} />
    </Link>
  );
}

/**
 * Homepage rebuilt against Images/.../01-home-page.jpeg
 * HERO IMAGE IS FROZEN — only copy/CTA position may change.
 */
export default function Home() {
  const { data: bestSellers, loading: loadingBS } = useProducts({ bestseller: true, limit: 6 });
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiPreview, setAiPreview] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const stubGenerate = (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setAiBusy(true);
    setTimeout(() => {
      setAiPreview(AI_PREVIEW_IMG);
      setAiBusy(false);
    }, 900);
  };

  return (
    <div className="home-page bg-[var(--sk-cream-100)]">
      {/* ─── HERO (image frozen; text LEFT) ─── */}
      <section
        className="relative overflow-hidden min-h-[560px] md:min-h-[620px] lg:min-h-[680px] flex flex-col justify-end"
        data-testid="home-hero"
      >
        <div className="absolute inset-0">
          <img
            src={HERO_IMG}
            alt="Sukhmal luxury dry fruit gift hamper"
            className="w-full h-full object-cover object-[78%_center] md:object-[82%_center]"
          />
          {/* Soft veil only on LEFT for type — keep hamper clear on right */}
          <div className="absolute inset-0 bg-gradient-to-r from-[rgba(45,27,20,0.88)] via-[rgba(45,27,20,0.55)] to-transparent w-full md:w-[58%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(45,27,20,0.55)] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 w-full pb-28 md:pb-32 pt-20 md:pt-24">
          <div className="sk-container">
            <div className="w-full max-w-[18.5rem] sm:max-w-sm md:max-w-md lg:max-w-lg text-left text-white pr-4">
              <h1 className="font-display text-[2.15rem] sm:text-[2.6rem] md:text-[3.15rem] lg:text-[3.4rem] font-bold leading-[1.08] tracking-[-0.02em]">
                <span className="text-white">Crafted with Care.</span>
                <br />
                <span className="text-[var(--sk-gold-300)]">Gifted with Love.</span>
              </h1>
              <p className="mt-4 md:mt-5 text-cream-200/90 text-[14px] md:text-[17px] leading-relaxed font-light">
                Premium Dry Fruits & Handcrafted Gift Hampers for Every Celebration.
              </p>
              <div className="mt-7 md:mt-8 flex flex-col sm:flex-row gap-3 items-stretch sm:items-start">
                <Link
                  to="/gift-hampers"
                  data-testid="hero-explore-hampers"
                  className="sk-btn-primary !bg-[var(--sk-brown-900)] hover:!bg-[var(--sk-brown-700)] text-[14px] md:text-[15px] !py-3.5 !px-5 md:!px-6 !rounded-[10px] justify-center sm:justify-start"
                >
                  Explore Gift Hampers <ChevronRight size={18} />
                </Link>
                <Link
                  to="/build-hamper/budget"
                  data-testid="hero-build-hamper"
                  className="inline-flex items-center justify-center gap-2 text-[14px] md:text-[15px] font-semibold !py-3.5 !px-5 md:!px-6 rounded-[10px] border-[1.5px] border-white bg-white text-[var(--sk-brown-900)] hover:bg-cream-100 transition-colors"
                >
                  Build Your Own Hamper <ChevronRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <TrustStrip overlay />
      </section>

      {/* ─── Shop by Category (6 circles) ─── */}
      <section className="sk-container py-12 md:py-16" data-testid="home-categories">
        <FlourishTitle
          title="Shop by Category"
          cta={<ViewAllLink to="/category/all">View All Categories</ViewAllLink>}
        />
        <ScrollRow testId="shop-by-category" className="px-1 md:px-8">
          {SHOP_CATEGORY_TILES.map((c) => (
            <Link
              key={c.name}
              to={c.to}
              data-testid={`cat-tile-${c.name.toLowerCase()}`}
              className="w-[112px] md:w-[128px] flex flex-col items-center text-center group shrink-0"
            >
              <div className="w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-full overflow-hidden bg-[var(--sk-cream-200)] shadow-[0_8px_24px_rgba(60,36,21,0.1)] ring-1 ring-[var(--sk-line)] group-hover:shadow-[0_12px_28px_rgba(60,36,21,0.16)] transition-shadow">
                <img src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              </div>
              <div className="mt-3 font-display font-bold text-brand-900 text-[14px] md:text-[15px]">{c.name}</div>
              <div className="text-[11px] text-ink-500 mt-0.5 leading-snug">{c.sub}</div>
            </Link>
          ))}
        </ScrollRow>
      </section>

      {/* ─── Festival Collections ─── */}
      <section className="bg-[var(--sk-cream-200)] py-12 md:py-16" data-testid="home-festivals">
        <div className="sk-container">
          <FlourishTitle
            title="Festival Collections"
            cta={<ViewAllLink to="/festival-collections">View All Collections</ViewAllLink>}
          />
          <ScrollRow testId="festival-collections" className="px-1 md:px-8">
            {FESTIVAL_TILES.map((f) => (
              <Link
                key={f.key}
                to={f.to}
                data-testid={`fest-${f.key}`}
                className="w-[180px] md:w-[200px] group block shrink-0"
              >
                <div className="rounded-2xl overflow-hidden bg-white shadow-sk-sm aspect-[4/3] ring-1 ring-[var(--sk-line)]">
                  <img src={f.image} alt={f.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <div className="mt-3 text-center font-display font-bold text-brand-900 text-[15px] md:text-base">
                  {f.name}
                </div>
              </Link>
            ))}
          </ScrollRow>
        </div>
      </section>

      {/* ─── Best Sellers ─── */}
      <section className="sk-container py-12 md:py-16" data-testid="home-bestsellers">
        <FlourishTitle
          title="Best Sellers"
          cta={<ViewAllLink to="/category/all">View All Best Sellers</ViewAllLink>}
        />
        <ScrollRow testId="best-sellers" className="px-1 md:px-8">
          {loadingBS
            ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-[210px]"><ProductSkeleton /></div>
            ))
            : bestSellers.map((p) => (
              <div key={p.id} className="w-[210px] md:w-[220px]">
                <ProductCard p={p} variant="labeled" />
              </div>
            ))}
        </ScrollRow>
      </section>

      {/* ─── Make Every Gift Extra Special ─── */}
      <section className="bg-[var(--sk-cream-300)]" data-testid="home-byoh">
        <div className="sk-container py-12 md:py-16 lg:py-[4.5rem] grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
          <div>
            <h2 className="sk-section-title text-3xl md:text-4xl lg:text-[2.5rem] leading-[1.15] max-w-md">
              Make Every Gift Extra Special
            </h2>
            <p className="text-ink-600 mt-4 md:text-[16px] max-w-md leading-relaxed">
              Create a custom hamper — pick your budget, container, and favourites, then add a personal message.
            </p>
            <Link
              to="/build-hamper/budget"
              className="sk-btn-primary mt-7 inline-flex text-base !py-3.5 !px-6"
              data-testid="cta-build"
            >
              Build Your Own Hamper <ChevronRight size={16} />
            </Link>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-sk-lg aspect-[5/4] lg:h-[400px] lg:aspect-auto ring-1 ring-[var(--sk-line)]">
            <img src={BYOH_BANNER_IMG} alt="Luxury open gift box with dry fruits" className="w-full h-full object-cover" loading="lazy" />
          </div>
        </div>
      </section>

      {/* ─── AI Image + Gift Advisor ─── */}
      <section className="sk-container py-12 md:py-16" data-testid="home-ai">
        <div className="grid lg:grid-cols-2 gap-5 md:gap-6">
          <div className="rounded-2xl border border-[var(--sk-line)] bg-white p-6 md:p-8 shadow-sk-sm overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
              <Wand2 size={20} className="text-[var(--sk-gold-500)]" strokeWidth={1.5} />
              <h3 className="sk-section-title text-xl md:text-2xl">AI Image Generation</h3>
            </div>
            <p className="text-ink-600 mt-2 text-sm md:text-[15px] leading-relaxed">
              Describe your dream gift hamper and our AI will create a beautiful visual just for you.
            </p>
            <form onSubmit={stubGenerate} className="mt-5 space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Diwali hamper with almonds & dates in a wooden basket"
                  className="sk-input !pl-10"
                  data-testid="ai-prompt"
                />
              </div>
              <button type="submit" disabled={aiBusy} className="sk-btn-primary" data-testid="ai-generate">
                <Sparkles size={16} /> {aiBusy ? 'Generating…' : 'Generate Image'} <ChevronRight size={16} />
              </button>
            </form>
            <div className="mt-6 flex justify-end">
              <div className="relative w-[160px] md:w-[180px] -rotate-[2deg] rounded-xl overflow-hidden shadow-sk-lg border-4 border-white bg-[var(--sk-cream-200)]">
                <img
                  src={aiPreview || AI_PREVIEW_IMG}
                  alt="AI Generated Preview"
                  className={`w-full aspect-square object-cover ${aiBusy ? 'opacity-40' : ''}`}
                />
                <div className="absolute bottom-0 inset-x-0 bg-brand-900/85 text-white text-[10px] tracking-wide uppercase text-center py-1.5 font-semibold">
                  AI Generated Preview
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--sk-line)] bg-white p-6 md:p-8 shadow-sk-sm flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare size={20} className="text-[var(--sk-gold-500)]" strokeWidth={1.5} />
              <h3 className="sk-section-title text-xl md:text-2xl">Gift Advisor Assistant</h3>
            </div>
            <p className="text-ink-600 mt-2 text-sm md:text-[15px] leading-relaxed">
              Not sure what to gift? Our AI Assistant opens a smart chat to help you find the perfect hamper in just a few clicks.
            </p>
            <div className="mt-5 flex-1 rounded-xl border border-[var(--sk-line)] bg-[var(--sk-cream-100)] overflow-hidden flex flex-col min-h-[210px]">
              <div className="px-4 py-2.5 bg-brand-900 text-white text-sm font-semibold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--sk-green-500)]" /> Gift Advisor Assistant
              </div>
              <div className="p-4 space-y-3 flex-1">
                <div className="max-w-[90%] bg-white border border-[var(--sk-line)] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-[13px] text-ink-600 shadow-sk-sm">
                  Hi! Tell me the occasion, budget, and who you’re gifting — I’ll suggest the perfect hamper.
                </div>
                <div className="max-w-[80%] ml-auto bg-brand-900 text-white rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-[13px]">
                  Anniversary gift, budget ₹3,500
                </div>
              </div>
              <div className="p-3 border-t border-[var(--sk-line)] flex gap-2 bg-white/70">
                <input disabled placeholder="Type your message…" className="sk-input !py-2 text-sm opacity-70" />
                <button type="button" className="sk-btn-primary !px-3" aria-label="Send"><Send size={16} /></button>
              </div>
            </div>
            <button
              type="button"
              className="sk-btn-primary mt-5 self-start"
              data-testid="open-gift-advisor"
              onClick={() => alert('Gift Advisor opens here (coming soon).')}
            >
              Open Gift Advisor <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── Why Choose Sukhmal ─── */}
      <section className="bg-[var(--sk-cream-200)] py-12 md:py-16" data-testid="home-why">
        <div className="sk-container">
          <FlourishTitle title="Why Choose Sukhmal?" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-4">
            {WHY_CHOOSE.map((item) => {
              const Ic = WHY_ICONS[item.key] || Star;
              return (
                <div key={item.key} className="text-center px-1">
                  <div className="mx-auto h-12 w-12 grid place-items-center text-[var(--sk-gold-500)]">
                    <Ic size={28} strokeWidth={1.35} />
                  </div>
                  <div className="font-display font-bold text-brand-900 mt-2.5 text-[14px] md:text-[15px] leading-snug">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-ink-500 mt-0.5">{item.sub}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Wedding + Corporate ─── */}
      <section className="sk-container py-12 md:py-16 grid md:grid-cols-2 gap-5" data-testid="home-promos">
        <Link to="/wedding-gifts" className="relative block rounded-2xl overflow-hidden group h-[280px] md:h-[320px]" data-testid="promo-wedding">
          <img src={WEDDING_PROMO_IMG} alt="Wedding gift hamper" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(45,27,20,0.75)] via-[rgba(45,27,20,0.15)] to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="font-display font-bold text-2xl md:text-3xl">Wedding Gifts</div>
            <span className="inline-flex items-center gap-1 mt-3 sk-btn-primary !py-2.5 !px-4 text-sm">
              Explore Wedding Gifts <ChevronRight size={14} />
            </span>
          </div>
        </Link>
        <Link to="/corporate-gifts" className="relative block rounded-2xl overflow-hidden group h-[280px] md:h-[320px]" data-testid="promo-corporate">
          <img src={CORP_PROMO_IMG} alt="Corporate gift hamper" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(45,27,20,0.8)] via-[rgba(45,27,20,0.2)] to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="font-display font-bold text-2xl md:text-3xl">Corporate Gifting</div>
            <span className="inline-flex items-center gap-1 mt-3 sk-btn-primary !py-2.5 !px-4 text-sm">
              Explore Corporate Gifts <ChevronRight size={14} />
            </span>
          </div>
        </Link>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="bg-[var(--sk-cream-300)] py-12 md:py-16" data-testid="home-testimonials">
        <div className="sk-container">
          <FlourishTitle title="What Our Customers Say" />
          <ScrollRow testId="testimonials" className="px-1 md:px-8">
            {TESTIMONIALS.map((t, i) => (
              <article key={i} className="bg-white rounded-2xl border border-[var(--sk-line)] p-5 md:p-6 w-[300px] md:w-[320px] flex flex-col shadow-sk-sm">
                <div className="flex items-center gap-0.5 text-[var(--sk-star)] mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={14} className={j < t.rating ? 'fill-current' : 'opacity-20'} />
                  ))}
                </div>
                <p className="text-[13px] md:text-[14px] leading-relaxed text-ink-600 italic flex-1">“{t.text}”</p>
                <div className="mt-5 flex items-center gap-3 pt-4 border-t border-[var(--sk-line)]">
                  <img src={t.avatar} alt="" className="w-11 h-11 rounded-full object-cover" loading="lazy" />
                  <div>
                    <div className="font-semibold text-brand-900 text-[13px]">{t.name}</div>
                    <div className="text-[11px] text-[var(--sk-gold-500)] font-semibold inline-flex items-center gap-1 mt-0.5">
                      <ShieldCheck size={12} /> Verified Buyer
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </ScrollRow>
        </div>
      </section>

      {/* ─── Instagram ─── */}
      <section className="sk-container py-12 md:py-16" data-testid="home-instagram">
        <FlourishTitle title="Follow Us on Instagram" />
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-2.5">
          {INSTAGRAM_POSTS.map((im, i) => {
            const isLast = i === INSTAGRAM_POSTS.length - 1;
            return (
              <a
                key={i}
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="relative aspect-square overflow-hidden rounded-lg block bg-[var(--sk-cream-200)] group"
              >
                <img src={im} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                {isLast && (
                  <div className="absolute inset-0 bg-brand-900/70 grid place-items-center text-white">
                    <div className="text-center">
                      <Instagram size={22} className="mx-auto" />
                      <div className="mt-1.5 text-[11px] md:text-xs font-semibold">View More</div>
                    </div>
                  </div>
                )}
              </a>
            );
          })}
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-brand-900 text-white">
        <div className="sk-container py-8 md:py-10 flex flex-col md:flex-row md:items-center gap-5 md:gap-8 justify-between">
          <div>
            <h3 className="font-display text-xl md:text-2xl font-bold">Get Exclusive Offers & Updates</h3>
            <p className="text-cream-200/70 text-sm mt-1">Join our newsletter for festive launches and member-only deals.</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setNewsletterEmail('');
              setSubscribed(true);
              setTimeout(() => setSubscribed(false), 2500);
            }}
            className="flex w-full md:w-auto md:min-w-[400px] gap-2"
          >
            <input
              type="email"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Your email address"
              className="sk-input !bg-white !border-transparent flex-1"
              aria-label="Email for newsletter"
            />
            <button type="submit" className="sk-btn-gold whitespace-nowrap !px-5">
              {subscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
