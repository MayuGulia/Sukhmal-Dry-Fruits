import React from 'react';
import { PageHeader } from '@/components/shared/Breadcrumb';
import { TIMELINE, CERTS } from '@/data/mockContent';
import { Users, Award, TrendingUp, Package, Heart } from 'lucide-react';

export default function About() {
  const stats = [
    { Ic: TrendingUp, n: '30+', l: 'Years of Trust' },
    { Ic: Users, n: '50,000+', l: 'Happy Customers' },
    { Ic: Award, n: '400+', l: 'Corporate Clients' },
    { Ic: Package, n: '150+', l: 'Product Varieties' },
    { Ic: Heart, n: '4.9★', l: 'Customer Satisfaction' },
  ];

  return (
    <div>
      <PageHeader title="Our Story" subtitle="Three generations of nut-lovers, one obsession: freshness." breadcrumb={[{ label: 'About Us' }]} />
      <section className="sk-container py-14 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="sk-section-eyebrow">BRAND STORY</div>
          <h2 className="sk-section-title text-3xl md:text-4xl mt-2">Curating Freshness Since 1994</h2>
          <p className="text-ink-600 mt-4">Founded in the bustling lanes of Old Delhi, Sukhmal Dry Fruits Korner was born from a simple belief — that everyone deserves access to the freshest, purest, most premium dry fruits, sourced directly from where they’re grown best.</p>
          <p className="text-ink-600 mt-3">From Kashmir’s walnut groves to Iran’s pistachio orchards to California’s almond farms, we travel far to bring the best home. Three decades in, that promise hasn’t changed.</p>
          <blockquote className="mt-6 border-l-4 border-gold-500 pl-4 italic text-brand-900">“We don’t just sell dry fruits. We deliver an experience — hand-picked, carefully packed, and thoughtfully shipped.” <div className="text-[12px] text-ink-500 not-italic mt-1">— Rajesh Sukhmal, Founder</div></blockquote>
        </div>
        <img src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop" alt="Founder" className="rounded-2xl object-cover w-full h-[420px]" />
      </section>

      <section className="bg-cream-200 py-14">
        <div className="sk-container">
          <div className="text-center mb-10"><div className="sk-section-eyebrow">MILESTONES</div><h2 className="sk-section-title text-3xl md:text-4xl mt-2">The Journey So Far</h2></div>
          <div className="relative pl-8 md:pl-0">
            <div className="absolute left-3 md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-[2px] bg-gold-500" />
            <div className="space-y-8">
              {TIMELINE.map((t, i) => (
                <div key={t.year} className={`relative md:grid md:grid-cols-2 md:gap-8 md:items-center ${i % 2 === 0 ? '' : 'md:direction-rtl'}`}>
                  <div className={`sk-card p-5 ${i % 2 === 0 ? 'md:mr-8' : 'md:ml-8 md:col-start-2'}`}><div className="font-display text-3xl font-bold text-brand-900">{t.year}</div><div className="font-semibold text-brand-900">{t.title}</div><div className="text-sm text-ink-600 mt-1">{t.text}</div></div>
                  <div className="absolute -left-8 md:left-1/2 md:-translate-x-1/2 top-4 w-4 h-4 rounded-full bg-gold-500 ring-4 ring-cream-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="sk-container py-14">
        <div className="text-center mb-8"><div className="sk-section-eyebrow">CERTIFIED</div><h2 className="sk-section-title text-3xl md:text-4xl mt-2">Trust You Can Verify</h2></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CERTS.map((c) => (
            <div key={c.code} className="sk-card p-6 text-center"><div className="h-14 w-14 mx-auto rounded-full bg-cream-300 grid place-items-center font-display text-brand-900 font-bold">{c.code.charAt(0)}</div><div className="font-display font-bold text-brand-900 mt-3">{c.code}</div><div className="text-[12px] text-ink-500">{c.desc}</div></div>
          ))}
        </div>
      </section>

      <section className="bg-brand-900 text-white py-14">
        <div className="sk-container grid grid-cols-2 md:grid-cols-5 gap-6">
          {stats.map(({ Ic, n, l }) => (
            <div key={l} className="text-center"><Ic size={26} className="mx-auto text-gold-300" /><div className="font-display font-bold text-3xl mt-2">{n}</div><div className="text-[12px] opacity-80">{l}</div></div>
          ))}
        </div>
      </section>
    </div>
  );
}
