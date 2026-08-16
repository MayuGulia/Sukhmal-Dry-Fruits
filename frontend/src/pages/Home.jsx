import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight, Wand2, MessageSquare, Star, ShieldCheck,
  Award, Leaf, Package, Truck, HeartHandshake, Sparkles, Search, Send, Instagram,
} from 'lucide-react';
import ProductCard, { TrustStrip } from '@/components/shared/ProductCard';
import FlourishTitle from '@/components/home/FlourishTitle';
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
  HERO_VIDEO_SRC,
  HERO_VIDEO_LAYOUT,
  HERO_VIDEO_POSITION,
} from '@/data/homeBrand';
import { GiftBasketIcon } from '@/components/brand/BrandSeal';
import BrandVideo from '@/components/media/BrandVideo';
import { STORE_INSTAGRAM, STORE_INSTAGRAM_HANDLE } from '@/data/storeInfo';

const WHY_ICONS = {
  trust: Award,
  natural: Leaf,
  quality: Star,
  hygiene: Package,
  delivery: Truck,
  love: HeartHandshake,
};

function HeroBackgroundVideo({ className, fit = 'cover', showToggle = false, toggleClassName }) {
  return (
    <BrandVideo
      src={HERO_VIDEO_SRC}
      poster={HERO_IMG}
      fallback={HERO_IMG}
      fit={fit}
      position={fit === 'contain' ? 'center center' : HERO_VIDEO_POSITION}
      className={className}
      showToggle={showToggle}
      toggleClassName={toggleClassName}
    />
  );
}

function ViewAllLink({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--sk-gold-600)] hover:text-[var(--sk-brown-700)] transition-colors"
    >
      {children} <ChevronRight size={14} strokeWidth={2.25} />
    </Link>
  );
}

function HeroCopy({ inverted = true }) {
  const title = inverted ? 'text-white' : 'text-brand-900';
  const body = inverted ? 'text-white' : 'text-ink-600';
  const outline = inverted
    ? 'border-white bg-transparent text-white hover:bg-white/10'
    : 'border-brand-900/30 bg-transparent text-brand-900 hover:bg-cream-200';
  const solid = inverted
    ? 'bg-white text-[var(--sk-espresso)] hover:bg-cream-100'
    : 'bg-[var(--sk-espresso)] text-white hover:bg-brand-800';
  return (
    <div className={`relative w-full max-w-[18.5rem] sm:max-w-sm md:max-w-md lg:max-w-lg text-left ${inverted ? 'pr-4' : ''}`}>
      {inverted && (
        <div
          className="pointer-events-none absolute -inset-x-4 -inset-y-6 md:-inset-x-8 md:-inset-y-8 rounded-3xl bg-gradient-to-r from-black/80 via-black/55 to-transparent"
          aria-hidden
        />
      )}
      <div className="relative">
      <h1 className={`font-display text-[2.15rem] sm:text-[2.6rem] md:text-[3.15rem] lg:text-[3.5rem] font-bold leading-[1.08] tracking-[-0.02em] ${title}`}>
        <span>Crafted with Care.</span>
        <br />
        <span>Gifted with </span>
        <span className="italic text-[var(--sk-gold-600)]">Love.</span>
      </h1>
      <p className={`mt-4 md:mt-5 ${body} text-[14px] md:text-[17px] leading-relaxed font-light`}>
        Premium Dry Fruits & Handcrafted Gift Hampers for Every Celebration.
      </p>
      <div className="mt-7 md:mt-8 flex flex-col sm:flex-row gap-3 items-stretch sm:items-start">
        <Link
          to="/gift-hampers"
          data-testid="hero-explore-hampers"
          className={`inline-flex items-center justify-center gap-2 text-[14px] md:text-[15px] font-semibold !py-3.5 !px-5 md:!px-6 rounded-full border-[1.5px] transition-colors ${outline}`}
        >
          Explore Gift Hampers <ChevronRight size={18} />
        </Link>
        <Link
          to="/build-hamper/budget"
          data-testid="hero-build-hamper"
          className={`inline-flex items-center justify-center gap-2 text-[14px] md:text-[15px] font-semibold !py-3.5 !px-5 md:!px-6 rounded-full transition-colors ${solid}`}
        >
          Build Your Own Hamper <ChevronRight size={18} />
        </Link>
      </div>
      </div>
    </div>
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
  const splitHero = HERO_VIDEO_LAYOUT === 'split';

  const stubGenerate = (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setAiBusy(true);
    setTimeout(() => {
      setAiPreview(AI_PREVIEW_IMG);
      setAiBusy(false);
    }, 900);
  };

  const reviews = TESTIMONIALS.slice(0, 4);

  return (
    <div className="home-page bg-white">
      {/* ─── HERO ─── */}
      {splitHero ? (
        <section
          className="relative overflow-hidden bg-cream-100 min-h-[560px] md:min-h-[620px] lg:min-h-[680px]"
          data-testid="home-hero"
          data-hero-layout="split"
        >
          <div className="sk-container grid md:grid-cols-2 gap-8 md:gap-12 items-center py-12 md:py-16">
            <HeroCopy inverted={false} />
            <div className="relative mx-auto w-full max-w-xl">
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-black shadow-sk-lg">
                <HeroBackgroundVideo
                  fit="cover"
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>
          </div>
          <TrustStrip />
        </section>
      ) : (
        <section
          className="relative overflow-hidden w-full aspect-[16/9] min-h-[280px] max-h-[min(82vh,860px)] flex flex-col justify-end bg-black"
          data-testid="home-hero"
          data-hero-layout="cover"
        >
          <div className="absolute inset-0 overflow-hidden bg-black">
            <HeroBackgroundVideo
              fit="cover"
              showToggle
              toggleClassName="bottom-28 md:bottom-32 right-4 md:right-6"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent w-full md:w-[62%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
          </div>

          <div className="relative z-10 w-full pb-28 md:pb-32 pt-20 md:pt-24">
            <div className="sk-container">
              <HeroCopy />
            </div>
          </div>

          <TrustStrip overlay />
        </section>
      )}

      {/* ─── Shop by Category ─── */}
      <section className="bg-white py-12 md:py-16" data-testid="home-categories">
        <div className="sk-container">
          <FlourishTitle
            title="Shop by Category"
            cta={<ViewAllLink to="/category/all">View All Categories</ViewAllLink>}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5" data-testid="shop-by-category">
            {SHOP_CATEGORY_TILES.map((c) => (
              <Link
                key={c.name}
                to={c.to}
                data-testid={`cat-tile-${c.name.toLowerCase()}`}
                className="group flex flex-col text-center"
              >
                <div className="aspect-square rounded-[18px] overflow-hidden bg-[#F4EDE3] ring-1 ring-[var(--sk-line)] shadow-sk-sm group-hover:shadow-sk-md transition-shadow">
                  <img
                    src={c.image}
                    alt={c.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="mt-3 font-display font-bold text-brand-900 text-[15px] md:text-base">{c.name}</div>
                <div className="text-[12px] text-ink-500 mt-0.5 leading-snug">{c.sub}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Festival Collections ─── */}
      <section className="bg-white py-12 md:py-16 border-t border-[var(--sk-line)]" data-testid="home-festivals">
        <div className="sk-container">
          <FlourishTitle
            title="Festival Collections"
            cta={<ViewAllLink to="/festival-collections">View All Collections</ViewAllLink>}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5" data-testid="festival-collections">
            {FESTIVAL_TILES.map((f) => (
              <Link
                key={f.key}
                to={f.to}
                data-testid={`fest-${f.key}`}
                className="group block"
              >
                <div className="rounded-[18px] overflow-hidden bg-[#F4EDE3] shadow-sk-sm aspect-square ring-1 ring-[var(--sk-line)]">
                  <img
                    src={f.image}
                    alt={f.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="mt-3 text-center font-display font-bold text-brand-900 text-[15px] md:text-base">
                  {f.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Best Sellers ─── */}
      <section className="bg-white py-12 md:py-16 border-t border-[var(--sk-line)]" data-testid="home-bestsellers">
        <div className="sk-container">
          <FlourishTitle
            title="Best Sellers"
            cta={<ViewAllLink to="/category/all">View All Best Sellers</ViewAllLink>}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4" data-testid="best-sellers">
            {loadingBS
              ? Array.from({ length: 6 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))
              : (Array.isArray(bestSellers) ? bestSellers : []).map((p) => (
                <ProductCard key={p.id} p={p} variant="labeled" />
              ))}
          </div>
        </div>
      </section>

      {/* ─── Make Every Gift Extra Special ─── */}
      <section className="bg-[#F6F0E8]" data-testid="home-byoh">
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
              className="sk-btn-hamper mt-7 inline-flex text-[15px] !py-3.5 !px-6"
              data-testid="cta-build"
            >
              <GiftBasketIcon size={17} className="text-gold-400" />
              Build Your Own Hamper <ChevronRight size={16} />
            </Link>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-sk-lg aspect-[16/10] lg:h-[380px] lg:aspect-auto ring-1 ring-[var(--sk-line)]">
            <img src={BYOH_BANNER_IMG} alt="Luxury open gift box with dry fruits" className="w-full h-full object-cover object-center" loading="lazy" />
          </div>
        </div>
      </section>

      {/* ─── AI Image + Gift Advisor ─── */}
      <section className="bg-white py-12 md:py-16" data-testid="home-ai">
        <div className="sk-container">
          <div className="grid lg:grid-cols-2 gap-5 md:gap-6">
            <div className="rounded-2xl border border-[var(--sk-line)] bg-white p-6 md:p-8 shadow-sk-sm overflow-hidden">
              <div className="flex items-center gap-2 mb-1">
                <Wand2 size={20} className="text-[var(--sk-gold-600)]" strokeWidth={1.5} />
                <h3 className="sk-section-title text-xl md:text-2xl">AI Image Generation</h3>
              </div>
              <p className="text-ink-600 mt-2 text-sm md:text-[15px] leading-relaxed">
                Describe your dream gift hamper and our AI will create a beautiful visual just for you.
              </p>
              <div className="mt-5 grid sm:grid-cols-[1fr_148px] gap-4 items-start">
                <form onSubmit={stubGenerate} className="space-y-3">
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
                  <button type="submit" disabled={aiBusy} className="sk-btn-primary !bg-[var(--sk-espresso)]" data-testid="ai-generate">
                    <Sparkles size={16} /> {aiBusy ? 'Generating…' : 'Generate Image'} <ChevronRight size={16} />
                  </button>
                </form>
                <div className="relative w-full max-w-[148px] mx-auto sm:mx-0 rounded-xl overflow-hidden shadow-sk-lg border-4 border-white bg-[#F4EDE3]">
                  <img
                    src={aiPreview || AI_PREVIEW_IMG}
                    alt="AI Generated Preview"
                    className={`w-full aspect-square object-cover ${aiBusy ? 'opacity-40' : ''}`}
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-[var(--sk-espresso)]/85 text-white text-[10px] tracking-wide uppercase text-center py-1.5 font-semibold">
                    AI Generated Preview
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--sk-line)] bg-white p-6 md:p-8 shadow-sk-sm flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare size={20} className="text-[var(--sk-gold-600)]" strokeWidth={1.5} />
                <h3 className="sk-section-title text-xl md:text-2xl">Gift Advisor Assistant</h3>
              </div>
              <p className="text-ink-600 mt-2 text-sm md:text-[15px] leading-relaxed">
                Not sure what to gift? Our AI Assistant opens a smart chat to help you find the perfect hamper in just a few clicks.
              </p>
              <div className="mt-5 flex-1 rounded-xl border border-[var(--sk-line)] bg-[#FAF7F2] overflow-hidden flex flex-col min-h-[210px]">
                <div className="px-4 py-2.5 bg-[var(--sk-espresso)] text-white text-sm font-semibold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[var(--sk-green-500)]" /> Gift Advisor Assistant
                </div>
                <div className="p-4 space-y-3 flex-1">
                  <div className="max-w-[90%] bg-white border border-[var(--sk-line)] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-[13px] text-ink-600 shadow-sk-sm">
                    Hi! Tell me the occasion, budget, and who you’re gifting — I’ll suggest the perfect hamper.
                  </div>
                  <div className="max-w-[80%] ml-auto bg-[var(--sk-espresso)] text-white rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-[13px]">
                    Anniversary gift, budget ₹3,500
                  </div>
                </div>
                <div className="p-3 border-t border-[var(--sk-line)] flex gap-2 bg-white/70">
                  <input disabled placeholder="Type your message…" className="sk-input !py-2 text-sm opacity-70" />
                  <button type="button" className="sk-btn-primary !bg-[var(--sk-espresso)] !px-3" aria-label="Send"><Send size={16} /></button>
                </div>
              </div>
              <button
                type="button"
                className="sk-btn-primary !bg-[var(--sk-espresso)] mt-5 self-start"
                data-testid="open-gift-advisor"
                onClick={() => window.dispatchEvent(new CustomEvent('sk-open-gift-advisor'))}
              >
                Open Advisor <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Why Choose Sukhmal ─── */}
      <section className="bg-white py-12 md:py-16 border-t border-[var(--sk-line)]" data-testid="home-why">
        <div className="sk-container">
          <FlourishTitle title="Why Choose Sukhmal?" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-4">
            {WHY_CHOOSE.map((item) => {
              const Ic = WHY_ICONS[item.key] || Star;
              return (
                <div key={item.key} className="text-center px-1">
                  <div className="mx-auto h-14 w-14 grid place-items-center rounded-full border-[1.5px] border-[var(--sk-gold-600)] text-[var(--sk-gold-600)]">
                    <Ic size={26} strokeWidth={1.35} />
                  </div>
                  <div className="font-display font-bold text-brand-900 mt-3 text-[14px] md:text-[15px] leading-snug">
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
      <section className="bg-white py-12 md:py-16" data-testid="home-promos">
        <div className="sk-container grid md:grid-cols-2 gap-5">
          <Link to="/wedding-gifts" className="relative block rounded-2xl overflow-hidden group h-[280px] md:h-[320px]" data-testid="promo-wedding">
            <img src={WEDDING_PROMO_IMG} alt="Wedding gift hamper" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(31,22,16,0.75)] via-[rgba(31,22,16,0.15)] to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="font-display font-bold text-2xl md:text-3xl">Wedding Gifts</div>
              <span className="inline-flex items-center gap-1 mt-3 sk-btn-primary !bg-[var(--sk-espresso)] !py-2.5 !px-4 text-sm !rounded-full">
                Explore Wedding Gifts <ChevronRight size={14} />
              </span>
            </div>
          </Link>
          <Link to="/corporate-gifts" className="relative block rounded-2xl overflow-hidden group h-[280px] md:h-[320px]" data-testid="promo-corporate">
            <img src={CORP_PROMO_IMG} alt="Corporate gift hamper" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(31,22,16,0.8)] via-[rgba(31,22,16,0.2)] to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="font-display font-bold text-2xl md:text-3xl">Corporate Gifting</div>
              <span className="inline-flex items-center gap-1 mt-3 sk-btn-primary !bg-[var(--sk-espresso)] !py-2.5 !px-4 text-sm !rounded-full">
                Explore Corporate Gifts <ChevronRight size={14} />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="bg-white py-12 md:py-16 border-t border-[var(--sk-line)]" data-testid="home-testimonials">
        <div className="sk-container">
          <FlourishTitle title="What Our Customers Say" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5" data-testid="testimonials">
            {reviews.map((t, i) => (
              <article key={i} className="bg-white rounded-2xl border border-[var(--sk-line)] p-5 md:p-6 flex flex-col shadow-sk-sm">
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
                    <div className="text-[11px] text-[var(--sk-gold-600)] font-semibold inline-flex items-center gap-1 mt-0.5">
                      <ShieldCheck size={12} /> Verified Buyer
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Instagram ─── */}
      <section className="bg-white py-12 md:py-16" data-testid="home-instagram">
        <div className="sk-container">
          <FlourishTitle title="Follow Us on Instagram" />
          <p className="text-center text-ink-500 text-sm -mt-6 mb-8">
            <a href={STORE_INSTAGRAM} target="_blank" rel="noreferrer" className="hover:text-brand-900">
              {STORE_INSTAGRAM_HANDLE}
            </a>
          </p>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-2.5">
            {INSTAGRAM_POSTS.map((im, i) => {
              const isLast = i === INSTAGRAM_POSTS.length - 1;
              return (
                <a
                  key={i}
                  href={STORE_INSTAGRAM}
                  target="_blank"
                  rel="noreferrer"
                  className="relative aspect-square overflow-hidden rounded-lg block bg-[#F4EDE3] group"
                >
                  <img src={im} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  {isLast && (
                    <div className="absolute inset-0 bg-[var(--sk-espresso)]/70 grid place-items-center text-white">
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
        </div>
      </section>
    </div>
  );
}
