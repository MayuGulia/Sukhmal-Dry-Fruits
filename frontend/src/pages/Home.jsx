import React from 'react';
import { Link } from 'react-router-dom';
import { Gift, Sparkles, ChevronRight, Wand2, MessageSquare, Star, ShieldCheck, Truck, Package, Leaf, Award, Users } from 'lucide-react';
import ProductCard, { HamperCard, SectionHeader, TrustStrip } from '@/components/shared/ProductCard';
import { useCategories, useProducts, useHampers, ProductSkeleton } from '@/lib/catalog';
import { FESTIVALS_META, TESTIMONIALS, INSTAGRAM_POSTS } from '@/data/mockContent';

const HERO_IMG = 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=1600&auto=format&fit=crop&q=80';

export default function Home() {
  const { data: categories } = useCategories();
  const { data: bestSellers, loading: loadingBS } = useProducts({ bestseller: true, limit: 6 });
  const { data: hampers } = useHampers();

  const festivalHampers = hampers.slice(0, 5);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0"><img src={HERO_IMG} alt="Sukhmal premium dry fruits" className="w-full h-full object-cover" /><div className="sk-hero-veil" /></div>
        <div className="relative sk-container py-16 md:py-32 text-white">
          <div className="sk-section-eyebrow !text-gold-300">SUKHMAL DRY FRUITS KORNER</div>
          <h1 className="font-display text-4xl md:text-6xl font-bold mt-3 max-w-3xl leading-[1.05]">Crafted with Care.<br /> Gifted with Love.</h1>
          <p className="mt-5 text-cream-200/90 max-w-xl md:text-lg">Premium Dry Fruits & Handcrafted Gift Hampers for Every Celebration — hand-picked from Kashmir, Iran, California and beyond.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link to="/gift-hampers" data-testid="hero-explore-hampers" className="sk-btn-gold text-base !py-3.5 !px-6"><Gift size={18} /> Explore Gift Hampers</Link>
            <Link to="/build-hamper/budget" data-testid="hero-build-hamper" className="sk-btn-outline !bg-white/10 !border-white/40 !text-white text-base !py-3.5 !px-6"><Sparkles size={18} /> Build Your Own Hamper</Link>
          </div>
        </div>
      </section>

      <TrustStrip />

      {/* SHOP BY CATEGORY */}
      <section className="sk-container py-14 md:py-20">
        <SectionHeader eyebrow="CURATED FRESHNESS" title="Shop by Category" subtitle="Explore our full range of premium dry fruits, nuts, seeds, dates, berries and gift hampers." cta={<Link to="/category/all" className="sk-btn-ghost hidden md:inline-flex">View All <ChevronRight size={16} /></Link>} />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {categories.map((c) => (
            <Link key={c.slug} to={`/category/${c.slug}`} className="sk-card block group" data-testid={`cat-${c.slug}`}>
              <div className="aspect-square overflow-hidden bg-cream-200"><img src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" /></div>
              <div className="p-3 text-center">
                <div className="font-display font-bold text-brand-900">{c.name}</div>
                <div className="text-[11px] text-ink-500 mt-0.5">{c.count ?? ''} items</div>
              </div>
            </Link>
          ))}
          <Link to="/gift-hampers" className="sk-card block group" data-testid="cat-gift-hampers">
            <div className="aspect-square overflow-hidden bg-cream-300 grid place-items-center"><Gift size={40} className="text-brand-900" /></div>
            <div className="p-3 text-center"><div className="font-display font-bold text-brand-900">Gift Hampers</div><div className="text-[11px] text-ink-500 mt-0.5">{hampers.length} curated</div></div>
          </Link>
        </div>
      </section>

      {/* FESTIVAL COLLECTIONS */}
      <section className="bg-cream-200 py-14 md:py-20">
        <div className="sk-container">
          <SectionHeader eyebrow="CELEBRATE THE SEASON" title="Festival Collections" subtitle="Themed hampers curated for every celebration in the Indian calendar." cta={<Link to="/festival-collections" className="sk-btn-ghost hidden md:inline-flex">View All <ChevronRight size={16} /></Link>} />
          <div className="sk-scroll-x md:grid md:grid-cols-5 md:gap-4 md:scroll-auto">
            {FESTIVALS_META.map((f, i) => (
              <Link key={f.key} to={`/festival-collections#${f.key}`} className="sk-card block w-[240px] md:w-auto" data-testid={`fest-${f.key}`}>
                <div className="aspect-[4/3] overflow-hidden bg-cream-300" style={{ background: `linear-gradient(135deg, ${f.hue}22, ${f.hue}66)` }}>
                  {festivalHampers[i] && <img src={festivalHampers[i].image} alt={f.name} className="w-full h-full object-cover mix-blend-multiply" loading="lazy" />}
                </div>
                <div className="p-4"><div className="font-display text-lg font-bold text-brand-900">{f.name}</div><div className="text-[12px] text-ink-500 mt-0.5 line-clamp-2">{f.copy}</div></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="sk-container py-14 md:py-20">
        <SectionHeader eyebrow="CUSTOMER FAVOURITES" title="Best Sellers" subtitle="The freshest, most-loved items from our shelves." cta={<Link to="/category/all" className="sk-btn-ghost hidden md:inline-flex">Shop All <ChevronRight size={16} /></Link>} />
        <div className="sk-scroll-x md:grid md:grid-cols-3 lg:grid-cols-6 md:gap-4 md:scroll-auto">
          {loadingBS ? Array.from({length:6}).map((_,i)=><ProductSkeleton key={i} />) : bestSellers.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* MAKE EVERY GIFT SPECIAL */}
      <section className="bg-cream-300">
        <div className="sk-container py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="sk-section-eyebrow">PERSONALIZED GIFTING</div>
            <h2 className="sk-section-title text-3xl md:text-5xl mt-2">Make Every Gift Extra Special</h2>
            <p className="text-ink-600 mt-4 md:text-lg">Design a hamper from the ground up — pick your budget, choose your container, curate your products, add a hand-written message, and preview before you order.</p>
            <ul className="mt-5 space-y-2 text-brand-900">
              {['Live budget & total tracking','Choose from Basket, Box, Crate, or Round Box','Personalised gift card & message','AI-powered visual preview'].map((s) => <li key={s} className="flex items-center gap-2"><Sparkles size={16} className="text-gold-400" /> {s}</li>)}
            </ul>
            <Link to="/build-hamper/budget" className="sk-btn-primary mt-7 inline-flex text-base !py-3 !px-5" data-testid="cta-build">Start Building <ChevronRight size={16} /></Link>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-sk-lg">
            <img src="https://loremflickr.com/1200/800/gift,basket,fruit,ribbon?lock=123" alt="Custom hamper" className="w-full h-[420px] object-cover" />
          </div>
        </div>
      </section>

      {/* AI IMAGE + GIFT ADVISOR */}
      <section className="sk-container py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="sk-card p-6 md:p-8">
            <div className="sk-section-eyebrow flex items-center gap-2"><Wand2 size={14} /> AI IMAGE GENERATION</div>
            <h3 className="sk-section-title text-2xl md:text-3xl mt-2">Preview Your Gift, Before You Order</h3>
            <p className="text-ink-600 mt-2">Describe your dream hamper and our AI will generate a preview image so you can visualize before you commit.</p>
            <div className="mt-4 flex gap-2"><input placeholder="e.g. Diwali hamper with almonds, cashews & dates in a wooden basket" className="sk-input" /><button className="sk-btn-gold whitespace-nowrap"><Sparkles size={16} /> Generate</button></div>
            <div className="mt-3 text-[12px] text-ink-500">Powered by Nano Banana — wired in Phase 6.</div>
          </div>
          <div className="sk-card p-6 md:p-8">
            <div className="sk-section-eyebrow flex items-center gap-2"><MessageSquare size={14} /> GIFT ADVISOR</div>
            <h3 className="sk-section-title text-2xl md:text-3xl mt-2">Not sure what to gift?</h3>
            <p className="text-ink-600 mt-2">Chat with our AI Gift Advisor — tell us the occasion, budget and recipient, and we’ll curate the perfect suggestion.</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="bg-cream-200 p-3 rounded-lg"><b>You:</b> Anniversary gift for parents, budget ₹3,500</div>
              <div className="bg-brand-900 text-white p-3 rounded-lg"><b>Advisor:</b> The Royal Gold Hamper (₹2,499) is our top pick — elegantly packed with California almonds, Medjool dates, and Kashmiri walnuts.</div>
            </div>
            <button className="sk-btn-primary mt-4"><MessageSquare size={16} /> Open Gift Advisor</button>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="bg-cream-200 py-16 md:py-24">
        <div className="sk-container">
          <SectionHeader eyebrow="OUR PROMISE" title="Why Choose Sukhmal" subtitle="Three decades of trust, sourced directly, delivered fresh." />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[{Ic:Award,t:'30+ Years',s:'of Trust & Experience'},{Ic:Leaf,t:'100% Natural',s:'No preservatives'},{Ic:Star,t:'Premium Quality',s:'Grade-A only'},{Ic:Package,t:'Hygienic Packing',s:'Vacuum-sealed'},{Ic:Truck,t:'Fast Delivery',s:'Pan-India express'},{Ic:Users,t:'50,000+ Customers',s:'Loved us since 1994'}].map(({Ic,t,s})=>(
              <div key={t} className="sk-card p-5 text-center"><div className="h-12 w-12 mx-auto rounded-full bg-cream-300 grid place-items-center text-brand-900 mb-3"><Ic size={22} /></div><div className="font-display font-bold text-brand-900">{t}</div><div className="text-[12px] text-ink-500 mt-0.5">{s}</div></div>
            ))}
          </div>
        </div>
      </section>

      {/* WEDDING + CORPORATE PROMO */}
      <section className="sk-container py-16 md:py-24 grid md:grid-cols-2 gap-6">
        {[
          { to: '/wedding-gifts', title: 'Wedding Gifts', copy: 'Elegantly crafted hampers for the wedding season — bulk pricing and custom branding available.', img: 'https://loremflickr.com/1200/800/wedding,decoration,gift?lock=51' },
          { to: '/corporate-gifts', title: 'Corporate Gifting', copy: 'Premium hampers with your logo, personalised cards, and GST invoicing — delivered pan-India.', img: 'https://loremflickr.com/1200/800/corporate,gift,office?lock=88' },
        ].map((b) => (
          <Link key={b.to} to={b.to} className="relative block rounded-2xl overflow-hidden group h-[320px]">
            <img src={b.img} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={b.title} loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="font-display font-bold text-3xl">{b.title}</div>
              <div className="text-cream-200/90 text-sm mt-1 max-w-md">{b.copy}</div>
              <div className="inline-flex items-center gap-1 mt-3 text-gold-300 font-semibold">Explore <ChevronRight size={16} /></div>
            </div>
          </Link>
        ))}
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-cream-300 py-16 md:py-24">
        <div className="sk-container">
          <SectionHeader eyebrow="REAL PEOPLE. REAL LOVE." title="What Our Customers Say" />
          <div className="sk-scroll-x md:grid md:grid-cols-3 md:gap-4 md:scroll-auto">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="sk-card p-5 w-[300px] md:w-auto">
                <div className="flex items-center gap-1 text-gold-400 mb-2">{Array.from({ length: t.rating }).map((_, j) => <Star key={j} size={14} className="sk-star fill-current" />)}</div>
                <p className="text-[13px] leading-relaxed text-ink-600">“{t.text}”</p>
                <div className="mt-4 flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" loading="lazy" />
                  <div>
                    <div className="font-semibold text-brand-900 text-[13px]">{t.name}</div>
                    <div className="text-[11px] text-ink-500 flex items-center gap-1">{t.city} • <ShieldCheck size={11} className="text-[var(--sk-green-500)]" /> Verified</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INSTAGRAM */}
      <section className="sk-container py-16 md:py-24">
        <SectionHeader eyebrow="@SUKHMALDRYFRUITS" title="Follow Us on Instagram" />
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
          {INSTAGRAM_POSTS.map((im, i) => (
            <a key={i} href="https://instagram.com" target="_blank" rel="noreferrer" className="aspect-square overflow-hidden rounded-lg block bg-cream-200">
              <img src={im} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" loading="lazy" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
