import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/Breadcrumb';
import { inr } from '@/lib/utils';
import { useProducts } from '@/lib/catalog';
import { useCart } from '@/contexts/CartContext';
import { ArrowLeft, ArrowRight, Sparkles, Plus, Minus, Check, Trash2, Wand2, Gift, LoaderCircle } from 'lucide-react';

const STEPS = ['budget','hamper','products','gift-card','preview','confirm'];
const LABELS = ['Budget','Hamper','Products','Gift Card','Preview','Confirm'];
const BUDGETS = [1000, 2500, 5000, 7500, 10000, 15000];
const STYLES = [
  { key: 'basket', name: 'Wicker Basket', extra: 0,   img: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600&auto=format&fit=crop' },
  { key: 'box',    name: 'Premium Box',   extra: 150, img: 'https://images.unsplash.com/photo-1608797178974-15b35a64ede9?w=600&auto=format&fit=crop' },
  { key: 'crate',  name: 'Wooden Crate',  extra: 300, img: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop' },
  { key: 'round',  name: 'Round Box',     extra: 200, img: 'https://images.unsplash.com/photo-1608797178974-15b35a64ede9?w=600&auto=format&fit=crop' },
];
const CARDS = [
  { key: 'floral',    name: 'Floral',   img: 'https://images.unsplash.com/photo-1610725664285-7c57e6eeac3f?w=400&auto=format&fit=crop' },
  { key: 'classic',   name: 'Classic',  img: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&auto=format&fit=crop' },
  { key: 'gold',      name: 'Gold Foil',img: 'https://images.unsplash.com/photo-1599050751795-6cdaafbc2319?w=400&auto=format&fit=crop' },
  { key: 'minimal',   name: 'Minimal',  img: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&auto=format&fit=crop' },
];

const LS = 'sk_hamper_wizard_v1';

function loadState() {
  try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch { return {}; }
}

export default function BuildHamper() {
  const { step = 'budget' } = useParams();
  const nav = useNavigate();
  const idx = STEPS.indexOf(step);
  const [state, setState] = useState(() => ({ budget: 2500, style: STYLES[1].key, items: {}, cardStyle: CARDS[0].key, message: '', recipient: '', progress: 0, ...loadState() }));
  const [loading, setLoading] = useState(false);
  const { add } = useCart();
  const { data: PRODUCTS } = useProducts({ limit: 200 });

  const setPersist = (patch) => {
    setState((s) => { const next = { ...s, ...patch }; localStorage.setItem(LS, JSON.stringify(next)); return next; });
  };

  const chosen = useMemo(() => PRODUCTS.filter((p) => state.items[p.id]).map((p) => ({ ...p, qty: state.items[p.id] })), [state.items]);
  const styleObj = STYLES.find((s) => s.key === state.style);
  const productsTotal = chosen.reduce((s, p) => s + p.price * p.qty, 0);
  const total = productsTotal + (styleObj?.extra || 0);
  const remaining = state.budget - total;
  const overBudget = remaining < 0;

  const goto = (n) => nav(`/build-hamper/${STEPS[n]}`);

  const finish = () => {
    // Add hamper as single line item
    setLoading(true);
    setState((s) => ({ ...s, progress: 0 }));
    const iv = setInterval(() => setState((s) => ({ ...s, progress: Math.min(100, s.progress + 10) })), 120);
    setTimeout(() => {
      clearInterval(iv);
      const meta = { type: 'custom-hamper', style: state.style, message: state.message, recipient: state.recipient, cardStyle: state.cardStyle, items: chosen.map((p) => ({ id: p.id, name: p.name, qty: p.qty, price: p.price })) };
      add({ id: `custom_${Date.now()}`, name: `Custom Hamper (${styleObj.name})`, images: [styleObj.img], slug: 'custom-hamper', meta, price: total }, { qty: 1, variant: { w: 'Custom', price: total }, source: 'custom-hamper' });
      localStorage.removeItem(LS);
      nav('/cart');
    }, 1500);
  };

  return (
    <div>
      <section className="relative bg-cream-300 overflow-hidden">
        <div className="sk-container py-10 md:py-14 text-center">
          <div className="sk-section-eyebrow">GIFT WITH LOVE</div>
          <h1 className="font-display text-3xl md:text-5xl text-brand-900 font-bold mt-2">Build Your Own Hamper</h1>
          <p className="text-ink-600 mt-3 max-w-xl mx-auto">Design a bespoke hamper across 6 simple steps — pick, personalise, preview.</p>

          {/* Desktop stepper */}
          <div className="hidden md:flex items-center justify-center gap-4 mt-8">
            {STEPS.map((k, i) => (
              <React.Fragment key={k}>
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full grid place-items-center font-semibold text-sm ${i === idx ? 'bg-brand-900 text-white' : i < idx ? 'bg-gold-500 text-white' : 'bg-white text-ink-500 border border-line-strong'}`}>{i < idx ? <Check size={14} /> : i + 1}</div>
                  <div className={`text-[11px] mt-1 ${i === idx ? 'text-brand-900 font-semibold' : 'text-ink-500'}`}>{LABELS[i]}</div>
                </div>
                {i < STEPS.length - 1 && <div className={`w-10 h-[2px] ${i < idx ? 'bg-gold-500' : 'bg-line-strong'}`} />}
              </React.Fragment>
            ))}
          </div>
          {/* Mobile stepper */}
          <div className="md:hidden mt-6">
            <div className="text-sm text-brand-900 font-semibold">Step {idx + 1} of 6 — {LABELS[idx]}</div>
            <div className="h-2 mt-2 rounded-full bg-white overflow-hidden"><div className="h-full bg-brand-900" style={{ width: `${((idx + 1) / 6) * 100}%` }} /></div>
          </div>
        </div>
      </section>

      <div className="sk-container py-10 grid md:grid-cols-[1fr_320px] gap-8">
        {/* MAIN */}
        <div>
          {step === 'budget' && (
            <div>
              <h2 className="sk-section-title text-2xl md:text-3xl">Set Your Budget</h2>
              <p className="text-ink-600 mt-1">Choose your budget range and we’ll suggest the best options.</p>
              <div className="font-display font-bold text-brand-900 text-4xl mt-6">{inr(state.budget)}</div>
              <input type="range" min={500} max={20000} step={100} value={state.budget} onChange={(e) => setPersist({ budget: Number(e.target.value) })} className="w-full mt-4 accent-[var(--sk-brown-900)]" />
              <div className="mt-4 flex flex-wrap gap-2">
                {BUDGETS.map((b) => (
                  <button key={b} onClick={() => setPersist({ budget: b })} className={`px-4 py-2 rounded-full text-sm font-medium ${state.budget === b ? 'bg-brand-900 text-white' : 'bg-cream-200 text-brand-900 hover:bg-cream-300'}`}>{inr(b)}</button>
                ))}
                <button onClick={() => setPersist({ budget: 15000 })} className={`px-4 py-2 rounded-full text-sm font-medium ${state.budget >= 15000 ? 'bg-brand-900 text-white' : 'bg-cream-200 text-brand-900'}`}>₹15,000+</button>
              </div>
              <div className="mt-6 inline-flex items-center gap-2 sk-pill sk-pill-green"><Gift size={12} /> Approx. {Math.max(3, Math.floor(state.budget / 400))}–{Math.max(6, Math.floor(state.budget / 300))} premium products in this range</div>
            </div>
          )}

          {step === 'hamper' && (
            <div>
              <h2 className="sk-section-title text-2xl md:text-3xl">Choose Your Hamper</h2>
              <p className="text-ink-600 mt-1">Pick a container that fits the mood.</p>
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {STYLES.map((s) => (
                  <button key={s.key} onClick={() => setPersist({ style: s.key })} className={`sk-card overflow-hidden text-left ring-2 ${state.style === s.key ? 'ring-brand-900' : 'ring-transparent'}`}>
                    <div className="aspect-square overflow-hidden bg-cream-200"><img src={s.img} alt="" className="w-full h-full object-cover" /></div>
                    <div className="p-3"><div className="font-display font-bold text-brand-900">{s.name}</div><div className="text-[12px] text-ink-500">{s.extra ? `+${inr(s.extra)}` : 'Included'}</div></div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'products' && (
            <div>
              <h2 className="sk-section-title text-2xl md:text-3xl">Pick Your Products</h2>
              <p className="text-ink-600 mt-1">Add / remove from below. Live budget tracking on the right.</p>
              <div className="mt-6 grid md:grid-cols-2 gap-3">
                {PRODUCTS.map((p) => {
                  const qty = state.items[p.id] || 0;
                  return (
                    <div key={p.id} className="sk-card p-3 flex items-center gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-cream-200 shrink-0"><img src={p.images[0]} alt="" className="w-full h-full object-cover" /></div>
                      <div className="flex-1">
                        <div className="font-semibold text-brand-900 text-sm">{p.name}</div>
                        <div className="text-[11px] text-ink-500">{p.tagline}</div>
                        <div className="font-bold text-brand-900 mt-0.5 text-sm">{inr(p.price)}</div>
                      </div>
                      <div className="inline-flex items-center gap-2 border border-line-strong rounded-lg">
                        <button onClick={() => setPersist({ items: { ...state.items, [p.id]: Math.max(0, qty - 1) } })} className="p-1.5"><Minus size={12} /></button>
                        <span className="text-sm w-4 text-center">{qty}</span>
                        <button onClick={() => setPersist({ items: { ...state.items, [p.id]: qty + 1 } })} className="p-1.5"><Plus size={12} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 'gift-card' && (
            <div>
              <h2 className="sk-section-title text-2xl md:text-3xl">Add a Personal Touch</h2>
              <p className="text-ink-600 mt-1">Choose a gift card design and write a message.</p>
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                {CARDS.map((c) => (
                  <button key={c.key} onClick={() => setPersist({ cardStyle: c.key })} className={`sk-card overflow-hidden text-left ring-2 ${state.cardStyle === c.key ? 'ring-brand-900' : 'ring-transparent'}`}>
                    <div className="aspect-video bg-cream-200 overflow-hidden"><img src={c.img} alt="" className="w-full h-full object-cover" /></div>
                    <div className="p-2 text-center text-sm font-semibold text-brand-900">{c.name}</div>
                  </button>
                ))}
              </div>
              <div className="mt-6 grid md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-brand-900 text-sm">Message (150 chars)</label>
                  <textarea value={state.message} onChange={(e) => setPersist({ message: e.target.value.slice(0, 150) })} rows={4} className="sk-input mt-2" placeholder="e.g. Wishing you joy this festive season" />
                  <div className="text-[11px] text-ink-500 text-right mt-1">{state.message.length}/150</div>
                </div>
                <div>
                  <label className="font-semibold text-brand-900 text-sm">Recipient Name (optional)</label>
                  <input value={state.recipient} onChange={(e) => setPersist({ recipient: e.target.value })} className="sk-input mt-2" placeholder="e.g. The Sharma Family" />
                  <div className="mt-4 p-4 rounded-xl bg-cream-300">
                    <div className="sk-section-eyebrow">LIVE PREVIEW</div>
                    <div className="font-display text-brand-900 text-lg mt-1">To {state.recipient || 'You'}</div>
                    <div className="text-sm text-ink-600 mt-1">{state.message || '— your message will appear here —'}</div>
                    <div className="text-[11px] text-ink-500 mt-2">With love, from Sukhmal</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div>
              <h2 className="sk-section-title text-2xl md:text-3xl">Preview Your Hamper</h2>
              <p className="text-ink-600 mt-1">Review everything before confirming.</p>
              <div className="mt-6 grid md:grid-cols-2 gap-6">
                <div className="aspect-square rounded-2xl overflow-hidden bg-cream-200"><img src={styleObj.img} alt="" className="w-full h-full object-cover" /></div>
                <div className="space-y-3">
                  <div><span className="text-ink-500 text-sm">Container:</span> <b className="text-brand-900">{styleObj.name}</b></div>
                  <div><span className="text-ink-500 text-sm">Budget:</span> <b className="text-brand-900">{inr(state.budget)}</b></div>
                  <div><span className="text-ink-500 text-sm">Products Total:</span> <b className="text-brand-900">{inr(total)}</b></div>
                  <div>
                    <div className="text-ink-500 text-sm mb-1">Included Products:</div>
                    <ul className="space-y-1">{chosen.map((p) => <li key={p.id} className="text-sm text-brand-900 flex justify-between"><span>{p.name} × {p.qty}</span><span>{inr(p.price * p.qty)}</span></li>)}</ul>
                  </div>
                  {state.message && <div className="p-3 rounded-lg bg-cream-300 text-sm"><b>Gift Card:</b> “{state.message}”</div>}
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={() => goto(2)} className="sk-btn-outline"><Wand2 size={14} /> Redesign Hamper</button>
                <button onClick={() => { localStorage.removeItem(LS); nav('/build-hamper/budget'); }} className="sk-btn-outline">+ Create Another Hamper</button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="text-center py-14">
              {loading ? (
                <div className="space-y-4">
                  <LoaderCircle className="animate-spin text-brand-900 mx-auto" size={48} />
                  <div className="font-display text-2xl text-brand-900 font-bold">Preparing your hamper...</div>
                  <div className="max-w-sm mx-auto"><div className="h-2 rounded-full bg-cream-300 overflow-hidden"><div className="h-full bg-brand-900 transition-all" style={{ width: `${state.progress}%` }} /></div><div className="text-[12px] text-ink-500 mt-1">{state.progress}%</div></div>
                </div>
              ) : (
                <div>
                  <Sparkles size={40} className="text-gold-500 mx-auto" />
                  <h2 className="sk-section-title text-3xl mt-3">All Set!</h2>
                  <p className="text-ink-600 mt-2">Your custom hamper is ready to be added to cart.</p>
                  <button onClick={finish} className="sk-btn-primary mt-6"><Gift size={16} /> Add to Cart</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <aside className="sk-card p-5 h-fit sticky top-4">
          <div className="font-display font-bold text-brand-900 text-lg">Your Hamper</div>
          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-ink-500">Budget</span><b className="text-brand-900">{inr(state.budget)}</b></div>
            <div className="flex justify-between"><span className="text-ink-500">Container</span><b className="text-brand-900">{styleObj?.name} {styleObj?.extra ? `+${inr(styleObj.extra)}` : ''}</b></div>
            <div className="flex justify-between"><span className="text-ink-500">Spent</span><b className="text-brand-900">{inr(total)}</b></div>
            <div className="flex justify-between"><span className="text-ink-500">Remaining</span><b className={overBudget ? 'text-[var(--sk-red-500)]' : 'text-[var(--sk-green-500)]'}>{inr(remaining)}</b></div>
          </div>
          {chosen.length > 0 && (
            <div className="mt-4 border-t border-line pt-3 space-y-2">
              {chosen.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-[13px]">
                  <span className="text-brand-900 flex-1 truncate">{p.name} × {p.qty}</span>
                  <button onClick={() => setPersist({ items: { ...state.items, [p.id]: 0 } })} className="text-red-500"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          )}
          {overBudget && step === 'products' && <div className="mt-3 text-[12px] text-[var(--sk-red-500)] font-medium">Over budget — remove items or increase budget.</div>}

          <div className="mt-5 flex gap-2">
            {idx > 0 && <button onClick={() => goto(idx - 1)} className="sk-btn-outline !py-2 !px-3 text-sm flex-1"><ArrowLeft size={14} /> Back</button>}
            {idx < STEPS.length - 1 && <button onClick={() => goto(idx + 1)} disabled={overBudget && idx >= 2} className="sk-btn-primary !py-2 !px-3 text-sm flex-1">Continue <ArrowRight size={14} /></button>}
          </div>
        </aside>
      </div>
    </div>
  );
}
