import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Heart, ShoppingBag, MessageCircle, ShieldCheck, Truck, Package, Leaf, MinusIcon, PlusIcon, Loader } from 'lucide-react';
import { inr } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useProduct, useProducts } from '@/lib/catalog';
import { PageHeader } from '@/components/shared/Breadcrumb';
import ProductCard, { SectionHeader } from '@/components/shared/ProductCard';
import { api } from '@/lib/api';

export default function PDP() {
  const { slug } = useParams();
  const { data: p, loading } = useProduct(slug);
  const [variant, setVariant] = useState(null);
  const [qty, setQty] = useState(1);
  const [selectedImg, setSelectedImg] = useState(0);
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState(null);
  const [tab, setTab] = useState('description');
  const [showMsg, setShowMsg] = useState(false);
  const [msg, setMsg] = useState('');
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const { data: related } = useProducts({ category: p?.category, limit: 6 });

  // Initialize variant when product loads
  React.useEffect(() => {
    if (p?.variants?.length && !variant) setVariant(p.variants[0]);
  }, [p, variant]);

  const checkPincode = async (e) => {
    e.preventDefault();
    try {
      const r = await api.get(`/checkout/pincode/${pincode}`);
      setPincodeResult(r.data.ok ? { ok: true, text: `Delivery available. ${r.data.eta}` } : { ok: false, text: r.data.message });
    } catch { setPincodeResult({ ok: false, text: 'Please try again.' }); }
  };

  if (loading || !p) return <div className="sk-container py-24 text-center"><Loader className="animate-spin mx-auto text-brand-900" size={36} /><div className="mt-4 text-ink-500">Loading product…</div></div>;

  const activeVariant = variant || { w: '250g', price: p.price };
  const disc = p.mrp ? Math.round(((p.mrp - activeVariant.price) / p.mrp) * 100) : 0;
  const images = p.images && p.images.length ? p.images : ['https://loremflickr.com/800/800/nuts?lock=1'];

  return (
    <div>
      <PageHeader title={p.name} subtitle={p.tagline} breadcrumb={[{ label: 'Shop', to: '/category/all' }, { label: p.subcategory || p.category, to: `/category/${p.category}` }, { label: p.name }]} />
      <div className="sk-container py-8 md:py-12 grid md:grid-cols-2 gap-10">
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-cream-200 relative">
            <img src={images[selectedImg]} alt={p.name} className="w-full h-full object-cover" />
            {p.bestseller && <span className="sk-pill sk-pill-gold absolute top-4 left-4">Bestseller</span>}
            {p.stock === 0 && <div className="absolute inset-0 bg-black/50 grid place-items-center"><span className="sk-pill bg-red-500 text-white text-base">Out of stock</span></div>}
          </div>
          <div className="hidden md:flex mt-3 gap-2 overflow-x-auto">
            {images.map((im, i) => (
              <button key={i} onClick={() => setSelectedImg(i)} className={`w-20 h-20 rounded-lg overflow-hidden border-2 shrink-0 ${i === selectedImg ? 'border-brand-900' : 'border-line'}`}><img src={im} alt="" className="w-full h-full object-cover" /></button>
            ))}
          </div>
          <div className="md:hidden mt-3 flex justify-center gap-1.5">
            {images.map((_, i) => <button key={i} onClick={() => setSelectedImg(i)} className={`w-2 h-2 rounded-full ${i === selectedImg ? 'bg-brand-900' : 'bg-line-strong'}`} />)}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            {p.bestseller && <span className="sk-pill sk-pill-brown">Bestseller</span>}
            <div className="flex items-center gap-1 text-[12px] text-ink-600">
              <div className="flex items-center gap-0.5 text-gold-400">{Array.from({length:5}).map((_,i)=><Star key={i} size={14} fill={i<Math.round(p.rating)?'currentColor':'none'} className="sk-star" />)}</div>
              <span className="font-semibold text-brand-900">{p.rating}</span><span>({p.reviews} reviews)</span>
            </div>
            <span className="sk-pill sk-pill-green"><ShieldCheck size={12} /> Verified Seller</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-brand-900 mt-3">{p.name}</h1>
          <p className="text-ink-600 mt-1">{p.tagline}</p>

          <div className="mt-5 flex items-end gap-3">
            <div className="font-display font-bold text-brand-900 text-3xl">{inr(activeVariant.price)}</div>
            {p.mrp > activeVariant.price && <div className="text-ink-500 line-through pb-1">{inr(p.mrp)}</div>}
            {disc > 0 && <span className="sk-pill sk-pill-green pb-1">{disc}% OFF</span>}
          </div>
          <div className="text-[12px] text-ink-500 mt-1">Inclusive of all taxes</div>

          <div className="mt-5">
            <div className="text-[13px] font-semibold text-brand-900 mb-2">Pack Size: <span className="font-normal text-ink-600">{activeVariant.w}</span></div>
            <div className="flex flex-wrap gap-2">
              {(p.variants || []).map((v) => (
                <button key={v.w} onClick={() => setVariant(v)} data-testid={`pdp-variant-${v.w}`} className={`px-3.5 py-2 rounded-full border text-sm font-medium transition ${activeVariant.w === v.w ? 'bg-brand-900 text-white border-brand-900' : 'bg-white text-brand-900 border-line-strong hover:border-brand-900'}`}>{v.w} – {inr(v.price)}</button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <div className="inline-flex items-center rounded-lg border border-line-strong overflow-hidden">
              <button aria-label="Decrease" onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-cream-200"><MinusIcon size={14} /></button>
              <span className="px-4 py-2 font-semibold text-brand-900">{qty}</span>
              <button aria-label="Increase" onClick={() => setQty((q) => q + 1)} className="px-3 py-2 hover:bg-cream-200"><PlusIcon size={14} /></button>
            </div>
            <span className="sk-pill sk-pill-green"><Truck size={12} /> Free delivery on ₹799+</span>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
            <button onClick={() => add(p, { qty, variant: activeVariant })} disabled={p.stock === 0} data-testid="pdp-add-cart" className="sk-btn-primary col-span-2 md:col-span-2 !py-3.5"><ShoppingBag size={16} /> {p.stock === 0 ? 'Notify Me' : 'Add to Cart'}</button>
            <button onClick={() => toggle(p.id)} className={`sk-btn-outline !py-3.5 ${has(p.id) ? 'text-red-500 border-red-500' : ''}`}><Heart size={16} fill={has(p.id) ? 'currentColor' : 'none'} /> {has(p.id) ? 'Saved' : 'Wishlist'}</button>
          </div>

          <button onClick={() => setShowMsg((s) => !s)} className="mt-4 sk-btn-ghost text-sm">+ Add Gift Message</button>
          {showMsg && (<div className="mt-2"><textarea value={msg} onChange={(e) => setMsg(e.target.value.slice(0, 150))} rows={2} placeholder="Write your gift message…" className="sk-input" /><div className="text-[11px] text-ink-500 mt-1 text-right">{msg.length}/150</div></div>)}

          <form onSubmit={checkPincode} className="mt-6 sk-card p-4 flex items-center gap-2">
            <MapPinIcon /><div><div className="font-semibold text-brand-900 text-sm">Delivery Check</div><div className="text-[12px] text-ink-500">Enter pincode to check delivery</div></div>
            <input value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit pincode" className="sk-input !py-2 max-w-[140px] ml-auto" />
            <button className="sk-btn-primary !py-2 !px-4">Check</button>
          </form>
          {pincodeResult && <div className={`mt-2 text-[13px] ${pincodeResult.ok ? 'text-[var(--sk-green-500)]' : 'text-[var(--sk-red-500)]'}`}>{pincodeResult.text}</div>}

          <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-[var(--sk-green-500)] font-semibold"><MessageCircle size={16} /> Quick Order on WhatsApp</a>

          <div className="mt-6 grid grid-cols-5 gap-2 text-center border-t border-line pt-5">
            {[{Ic:Leaf,l:'Natural'},{Ic:Star,l:'Premium'},{Ic:ShieldCheck,l:'Handpicked'},{Ic:Truck,l:'Fast Delivery'},{Ic:Package,l:'Secure Pack'}].map(({Ic,l})=>(<div key={l} className="flex flex-col items-center gap-1 text-[11px] text-ink-600"><Ic size={20} className="text-brand-900" /> {l}</div>))}
          </div>
        </div>
      </div>

      <div className="sk-container pb-12">
        <div className="border-b border-line flex flex-wrap gap-1">
          {['description','highlights','allergen','reviews','faqs'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-3 text-sm font-semibold capitalize border-b-2 -mb-px ${tab === t ? 'text-brand-900 border-brand-900' : 'text-ink-500 border-transparent hover:text-brand-900'}`}>{t}</button>
          ))}
        </div>
        <div className="py-6 text-ink-600 leading-relaxed max-w-3xl">
          {tab === 'description' && <p className="whitespace-pre-line">{p.description || `Our ${p.name} are carefully hand-picked and cleaned in our HACCP-certified facility.`}</p>}
          {tab === 'highlights' && <ul className="list-disc pl-5 space-y-1">{(p.highlights?.length ? p.highlights : ['Premium grade','Natural','No preservatives']).map((h, i) => <li key={i}>{h}</li>)}</ul>}
          {tab === 'allergen' && <p className="whitespace-pre-line">{p.allergen_info || 'Tree Nuts | Non-GMO | No Artificial Additives'}</p>}
          {tab === 'reviews' && (
            <div>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div><div className="font-display text-3xl font-bold text-brand-900">{p.rating} <span className="text-lg text-ink-500 font-normal">/ 5</span></div><div className="flex items-center gap-1 text-gold-400 my-1">{Array.from({length:5}).map((_,i)=><Star key={i} size={14} fill={i<Math.round(p.rating)?'currentColor':'none'} />)}</div><div className="text-[12px] text-ink-500">{p.reviews} verified reviews</div></div>
                <div className="space-y-1.5">{[5,4,3,2,1].map((s) => (<div key={s} className="flex items-center gap-2 text-[12px]"><span className="w-3">{s}</span><Star size={12} className="sk-star fill-current" /><div className="flex-1 h-2 rounded-full bg-cream-300"><div className="h-full rounded-full bg-gold-500" style={{ width: `${Math.max(3, s * 18 - 5)}%` }} /></div><span className="w-8 text-right text-ink-500">{Math.round(p.reviews * s / 15)}</span></div>))}</div>
              </div>
              <div className="sk-card p-4"><div className="flex items-center gap-2 mb-2"><span className="font-semibold text-brand-900">Nikita V.</span><span className="sk-pill sk-pill-green text-[10px]">Verified</span></div><div className="flex items-center gap-1 text-gold-400">{Array.from({length:5}).map((_,i)=><Star key={i} size={12} className="sk-star fill-current" />)}</div><p className="text-sm text-ink-600 mt-2">Absolutely the freshest {p.name}. Big, plump, crunchy. Will reorder!</p></div>
            </div>
          )}
          {tab === 'faqs' && (
            <div className="space-y-3">{[{q:'Are these organic?',a:'100% natural and pesticide-free but not certified organic.'},{q:'Best-before?',a:'6 months from date of packaging.'},{q:'Do you ship internationally?',a:'Not currently — domestic India only.'}].map((f) => (<div key={f.q} className="sk-card p-4"><div className="font-semibold text-brand-900">{f.q}</div><div className="text-sm text-ink-600 mt-1">{f.a}</div></div>))}</div>
          )}
        </div>
      </div>

      <div className="sk-container pb-16">
        <SectionHeader title="You May Also Like" />
        <div className="sk-scroll-x md:grid md:grid-cols-4 md:gap-4 md:scroll-auto">
          {related.filter((x) => x.id !== p.id).slice(0, 6).map((x) => <ProductCard key={x.id} p={x} />)}
        </div>
      </div>
    </div>
  );
}

function MapPinIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-900"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
}
