import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/shared/Breadcrumb';
import { STORES, POLICIES, BLOG_POSTS, FAQS } from '@/data/mockContent';
import { MapPin, Phone, Clock, ChevronDown, ExternalLink, ArrowRight, Users, Rocket, Package } from 'lucide-react';
import { useState } from 'react';

export function StoreLocator() {
  return (
    <div>
      <PageHeader title="Our Stores" subtitle="Come say hi at one of our locations." breadcrumb={[{ label: 'Store Locator' }]} />
      <div className="sk-container py-10 grid md:grid-cols-3 gap-4">
        {STORES.map((s) => (
          <div key={s.name} className="sk-card overflow-hidden">
            <iframe title={s.name} src={s.map} className="w-full h-40 border-0" loading="lazy" />
            <div className="p-4">
              <div className="font-display font-bold text-brand-900">{s.name}</div>
              <div className="text-sm text-ink-600 mt-1 flex items-start gap-1.5"><MapPin size={14} className="mt-0.5 shrink-0" /> {s.address}</div>
              <div className="text-sm text-ink-600 mt-1.5 flex items-center gap-1.5"><Phone size={14} /> {s.phone}</div>
              <div className="text-[12px] text-ink-500 mt-1 flex items-center gap-1.5"><Clock size={12} /> {s.hours}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PolicyPage({ pageKey }) {
  const key = pageKey || (window.location.pathname.slice(1));
  const doc = POLICIES[key] || POLICIES['privacy-policy'];
  return (
    <div>
      <PageHeader title={doc.title} breadcrumb={[{ label: doc.title }]} />
      <div className="sk-container py-10 max-w-3xl">
        {doc.sections.map((s, i) => (
          <section key={i} className="mb-8"><h3 className="font-display text-xl font-bold text-brand-900 mb-2">{s.h}</h3><p className="text-ink-600 leading-relaxed">{s.p}</p></section>
        ))}
        <div className="text-[12px] text-ink-500 border-t border-line pt-4">Last updated: January 2025</div>
      </div>
    </div>
  );
}

export function Blog() {
  return (
    <div>
      <PageHeader title="The Sukhmal Blog" subtitle="Recipes, gifting guides, and wellness stories." breadcrumb={[{ label: 'Blog' }]} />
      <div className="sk-container py-10 grid md:grid-cols-3 gap-4">
        {BLOG_POSTS.map((p) => (
          <Link key={p.slug} to={`/blog/${p.slug}`} className="sk-card overflow-hidden group">
            <div className="aspect-[16/10] overflow-hidden bg-cream-200"><img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /></div>
            <div className="p-5">
              <div className="flex gap-2 flex-wrap mb-2">{p.tags.map((t) => <span key={t} className="sk-pill">{t}</span>)}</div>
              <div className="font-display font-bold text-brand-900 text-lg leading-tight">{p.title}</div>
              <p className="text-[13px] text-ink-600 mt-1 line-clamp-2">{p.excerpt}</p>
              <div className="mt-3 text-[12px] text-ink-500">{p.date}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function BlogArticle() {
  const { slug } = useParams();
  const post = BLOG_POSTS.find((p) => p.slug === slug) || BLOG_POSTS[0];
  return (
    <div>
      <PageHeader title={post.title} breadcrumb={[{ label: 'Blog', to: '/blog' }, { label: post.title }]} />
      <article className="sk-container py-10 max-w-3xl">
        <img src={post.image} alt={post.title} className="w-full h-[380px] object-cover rounded-2xl mb-6" />
        <div className="prose max-w-none">
          <p className="text-ink-600 leading-relaxed text-lg">{post.excerpt}</p>
          <p className="text-ink-600 mt-4 leading-relaxed">Almonds are one of nature’s most nutrient-dense snacks. They’re rich in vitamin E, magnesium, and healthy monounsaturated fats. Just a handful a day (≈28g) has been shown to support heart health, aid weight management, help control blood sugar, boost cognitive function, and even promote glowing skin.</p>
          <h3 className="font-display text-2xl text-brand-900 font-bold mt-6 mb-3">1. Heart Health</h3>
          <p className="text-ink-600 leading-relaxed">The monounsaturated fats in almonds have been linked to lower LDL (\u201cbad\u201d) cholesterol and higher HDL (\u201cgood\u201d) cholesterol.</p>
          <h3 className="font-display text-2xl text-brand-900 font-bold mt-6 mb-3">2. Skin & Hair</h3>
          <p className="text-ink-600 leading-relaxed">Vitamin E acts as an antioxidant, protecting cells from oxidative stress and keeping skin looking fresh.</p>
          <p className="text-ink-600 mt-4 leading-relaxed">Read further, and try our <Link className="text-brand-900 font-semibold underline" to="/product/california-almonds-premium">Premium California Almonds</Link>.</p>
        </div>
      </article>
    </div>
  );
}

export function Careers() {
  const roles = [
    { title: 'Warehouse Manager', place: 'Delhi', type: 'Full-time', team: 'Operations', Ic: Package },
    { title: 'D2C Growth Lead', place: 'Bangalore / Remote', type: 'Full-time', team: 'Marketing', Ic: Rocket },
    { title: 'Customer Delight Executive', place: 'Delhi', type: 'Full-time', team: 'Support', Ic: Users },
  ];
  return (
    <div>
      <PageHeader title="Careers at Sukhmal" subtitle="Join a 30-year-old family business rewriting how India gifts." breadcrumb={[{ label: 'Careers' }]} />
      <div className="sk-container py-10">
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="sk-card p-6"><h3 className="font-display font-bold text-brand-900 text-xl">Why Work With Us</h3><ul className="mt-3 space-y-2 text-sm text-ink-600 list-disc pl-4"><li>Real ownership — flat teams, fast decisions</li><li>Family-first culture (literally, since 1994)</li><li>Above-market pay + ESOPs</li><li>Health cover for you & your parents</li></ul></div>
          <div className="sk-card p-6 bg-cream-300"><h3 className="font-display font-bold text-brand-900 text-xl">Don’t see a role?</h3><p className="text-ink-600 mt-2 text-sm">Send your CV and a note about what excites you.</p><a href="mailto:careers@sukhmal.in" className="sk-btn-primary mt-4 inline-flex text-sm">careers@sukhmal.in <ExternalLink size={14} /></a></div>
        </div>
        <div className="font-display text-2xl text-brand-900 font-bold mb-3">Open Roles</div>
        <div className="space-y-3">
          {roles.map((r) => (
            <div key={r.title} className="sk-card p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-full bg-cream-300 text-brand-900 grid place-items-center"><r.Ic size={20} /></div>
              <div className="flex-1"><div className="font-semibold text-brand-900">{r.title}</div><div className="text-[12px] text-ink-500">{r.team} • {r.place} • {r.type}</div></div>
              <a href="mailto:careers@sukhmal.in" className="sk-btn-outline text-sm !py-2">Apply <ArrowRight size={14} /></a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FAQs() {
  const [open, setOpen] = useState(-1);
  return (
    <div>
      <PageHeader title="Frequently Asked Questions" breadcrumb={[{ label: 'FAQs' }]} />
      <div className="sk-container py-10 max-w-3xl">
        {FAQS.map((f, i) => (
          <div key={i} className="sk-card mb-2">
            <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between p-4 text-left">
              <span className="font-semibold text-brand-900">{f.q}</span>
              <ChevronDown size={16} className={`transition ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && <div className="px-4 pb-4 text-sm text-ink-600">{f.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="sk-container py-24 text-center">
      <div className="font-display text-8xl text-brand-900 font-bold">404</div>
      <div className="font-display text-2xl mt-2 text-brand-900">Page not found</div>
      <p className="text-ink-600 mt-2">The page you’re looking for doesn’t exist or has been moved.</p>
      <Link to="/" className="sk-btn-primary mt-5 inline-flex">Back to Home</Link>
    </div>
  );
}
