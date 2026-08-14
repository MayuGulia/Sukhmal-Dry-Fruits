import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { inr } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { verifiedImg } from '@/data/verifiedImages';
import {
  ArrowLeft, ArrowRight, Sparkles, Plus, Minus, Check, X, Gift, ShieldCheck,
  Crown, Heart, Pencil, Truck, Package, Leaf, Star, Box, ShoppingBag,
  PartyPopper, Briefcase, Cake, HandHeart, Flower2, LayoutGrid, Sparkle,
} from 'lucide-react';

const STEPS = ['budget', 'hamper', 'products', 'gift-card', 'preview', 'confirm'];
const LABELS = ['Budget', 'Hampers', 'Products', 'Gift Card', 'Preview', 'Confirm'];
const BUDGETS = [1000, 2500, 5000, 7500, 10000, 15000];
const LS = 'sk_hamper_wizard_v1';

const LIFE_NUTS = verifiedImg('nuts', 480);
const LIFE_BOX = '/brand/hero-luxury-hamper-v2.png';
const LIFE_TRAY = '/brand/byoh-lifestyle.png';
const LIFE_RIBBON = verifiedImg('royal-gold', 360);

const STYLES = [
  {
    key: 'basket',
    name: 'Classic Elegance Basket',
    type: 'Woven Basket',
    category: 'basket',
    capacity: '4 - 6 Items',
    serves: 'Serves 4 - 6',
    price: 2299,
    img: verifiedImg('gift-hampers', 600),
  },
  {
    key: 'box',
    name: 'Signature Box',
    type: 'Premium Rigid Box',
    category: 'box',
    capacity: '4 - 6 Items',
    serves: 'Serves 4 - 6',
    price: 2499,
    img: verifiedImg('royal-gold', 600),
  },
  {
    key: 'crate',
    name: 'Wooden Treasure Crate',
    type: 'Mango Wood Crate',
    category: 'wooden',
    capacity: '4 - 6 Items',
    serves: 'Serves 4 - 6',
    price: 2599,
    img: verifiedImg('wedding-c', 600),
  },
  {
    key: 'round',
    name: 'Luxury Round Box',
    type: 'Premium Round Box',
    category: 'luxury',
    capacity: '4 - 6 Items',
    serves: 'Serves 4 - 6',
    price: 2499,
    img: verifiedImg('corp-elite', 600),
  },
];

const CARDS = [
  { key: 'especially', name: 'Especially For You', tone: 'bg-[#F3E8D8]', accent: '#8B6914' },
  { key: 'wishes', name: 'Best Wishes', tone: 'bg-[#E8F0E4]', accent: '#5C8D44' },
  { key: 'thanks', name: 'Thank You', tone: 'bg-[#F7F0D8]', accent: '#C5A059' },
  { key: 'birthday', name: 'Happy Birthday', tone: 'bg-[#F8E8EC]', accent: '#C45A7A' },
  { key: 'custom', name: 'Create Your Own', tone: 'bg-white', accent: '#3C2415', custom: true },
];

const PRODUCT_TABS = [
  { key: 'all', label: 'All' },
  { key: 'nuts', label: 'Nuts' },
  { key: 'dry-fruits', label: 'Dry Fruits' },
  { key: 'seeds', label: 'Seeds' },
  { key: 'berries', label: 'Berries' },
  { key: 'chocolate', label: 'Chocolate' },
  { key: 'premium', label: 'Premium', icon: true },
];

const HAMPER_CATS = [
  { key: 'all', label: 'All Hampers', Icon: LayoutGrid },
  { key: 'bestsellers', label: 'Bestsellers', Icon: Star },
  { key: 'premium', label: 'Premium Hampers', Icon: Crown },
  { key: 'luxury', label: 'Luxury Hampers', Icon: Sparkle },
  { key: 'wooden', label: 'Wooden Hampers', Icon: Box },
  { key: 'basket', label: 'Basket Hampers', Icon: ShoppingBag },
  { key: 'box', label: 'Box Hampers', Icon: Gift },
];

const PRODUCT_CATS = [
  { key: 'all', label: 'All Products', Icon: LayoutGrid },
  { key: 'bestsellers', label: 'Bestsellers', Icon: Star },
  { key: 'premium', label: 'Premium', Icon: Crown },
  { key: 'nuts', label: 'Nuts', Icon: Leaf },
  { key: 'dry-fruits', label: 'Dry Fruits', Icon: Flower2 },
  { key: 'seeds', label: 'Seeds', Icon: Sparkle },
  { key: 'berries', label: 'Berries', Icon: Heart },
];

const OCCASIONS = [
  { key: 'festivals', label: 'Festivals', Icon: PartyPopper },
  { key: 'weddings', label: 'Weddings', Icon: Flower2 },
  { key: 'corporate', label: 'Corporate Gifting', Icon: Briefcase },
  { key: 'birthday', label: 'Birthday', Icon: Cake },
  { key: 'thanks', label: 'Thank You', Icon: HandHeart },
  { key: 'special', label: 'Special Moments', Icon: Sparkles },
];

const MOCK_PRODUCTS = [
  { id: 'mp1', name: 'California Almonds', price: 299, weight: '250g', category: 'nuts', bestseller: true, img: verifiedImg('almonds', 400) },
  { id: 'mp2', name: 'Premium Cashews', price: 349, weight: '250g', category: 'nuts', bestseller: true, img: verifiedImg('cashews', 400) },
  { id: 'mp3', name: 'Pistachios (Roasted)', price: 399, weight: '250g', category: 'nuts', premium: true, img: verifiedImg('pistachios', 400) },
  { id: 'mp4', name: 'Walnut Kernels', price: 379, weight: '250g', category: 'nuts', img: verifiedImg('walnuts', 400) },
  { id: 'mp5', name: 'Premium Medjool Dates', price: 449, weight: '250g', category: 'dates', bestseller: true, premium: true, img: verifiedImg('medjool', 400) },
  { id: 'mp6', name: 'Golden Raisins', price: 199, weight: '250g', category: 'dry-fruits', img: verifiedImg('raisins', 400) },
  { id: 'mp7', name: 'Dried Cranberries', price: 279, weight: '200g', category: 'berries', img: verifiedImg('cranberries', 400) },
  { id: 'mp8', name: 'Blueberry Delight', price: 329, weight: '200g', category: 'berries', premium: true, img: verifiedImg('blueberries', 400) },
  { id: 'mp9', name: 'Pumpkin Seeds', price: 249, weight: '250g', category: 'seeds', img: verifiedImg('pumpkin', 400) },
  { id: 'mp10', name: 'Chia Seeds', price: 229, weight: '250g', category: 'seeds', img: verifiedImg('chia', 400) },
  { id: 'mp11', name: 'Ajwa Dates', price: 599, weight: '250g', category: 'dates', premium: true, img: verifiedImg('ajwa', 400) },
  { id: 'mp12', name: 'Dark Chocolate Almonds', price: 399, weight: '200g', category: 'chocolate', bestseller: true, img: verifiedImg('almonds', 420) },
];

function loadState() {
  try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch { return {}; }
}

function approxRange(budget) {
  const low = Math.max(3, Math.floor(budget / 550));
  const high = Math.max(low + 2, Math.floor(budget / 350));
  return { low, high };
}

function LifestyleChrome({ variant = 'budget' }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <img
        src={LIFE_NUTS}
        alt=""
        className={`absolute object-cover rounded-2xl shadow-lg opacity-90 ${
          variant === 'budget' ? '-left-4 top-10 w-32 md:w-44 rotate-[-8deg] hidden sm:block' : '-left-6 top-20 w-28 md:w-40 rotate-[-6deg] hidden md:block'
        }`}
      />
      <img
        src={LIFE_RIBBON}
        alt=""
        className="absolute -left-2 bottom-24 w-24 md:w-32 opacity-80 hidden lg:block rotate-[12deg] rounded-xl object-cover aspect-square"
      />
      <img
        src={LIFE_BOX}
        alt=""
        className={`absolute object-cover rounded-xl shadow-xl opacity-95 ${
          variant === 'budget' ? '-right-2 top-4 w-28 md:w-40 rotate-[6deg] hidden sm:block' : '-right-4 top-8 w-32 md:w-44 rotate-[4deg] hidden md:block'
        }`}
      />
      <img
        src={LIFE_TRAY}
        alt=""
        className="absolute -right-4 bottom-6 w-36 md:w-48 rounded-full opacity-90 shadow-lg object-cover aspect-square border-4 border-white/70 hidden sm:block"
      />
      <div className="absolute left-1/4 bottom-10 w-28 h-28 rounded-full bg-[var(--sk-gold-300)]/30 blur-3xl" />
    </div>
  );
}

function Stepper({ idx }) {
  return (
    <>
      <div className="hidden md:flex items-center justify-center gap-1.5 lg:gap-2.5 mt-7">
        {STEPS.map((k, i) => (
          <React.Fragment key={k}>
            <div className="flex flex-col items-center min-w-[4.25rem]">
              <div
                className={`w-9 h-9 rounded-full grid place-items-center font-semibold text-sm transition-colors ${
                  i === idx
                    ? 'bg-[var(--sk-brown-900)] text-white shadow-md'
                    : i < idx
                      ? 'bg-[var(--sk-brown-900)] text-white'
                      : 'bg-white text-[var(--sk-ink-400)] border border-[var(--sk-line-strong)]'
                }`}
              >
                {i < idx ? <Check size={14} strokeWidth={3} /> : i + 1}
              </div>
              <div className={`text-[11px] mt-1.5 ${i === idx ? 'text-[var(--sk-brown-900)] font-semibold' : 'text-[var(--sk-ink-500)]'}`}>
                {LABELS[i]}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-7 lg:w-10 h-[2px] mb-5 ${i < idx ? 'bg-[var(--sk-brown-900)]' : 'bg-[var(--sk-line-strong)]'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="md:hidden mt-5 max-w-sm mx-auto">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--sk-brown-900)] font-semibold">Step {idx + 1} of 6</span>
          <span className="text-[var(--sk-ink-500)]">{LABELS[idx]}</span>
        </div>
        <div className="h-2 mt-2 rounded-full bg-white overflow-hidden border border-[var(--sk-line)]">
          <div
            className="h-full bg-[var(--sk-brown-900)] transition-all duration-300"
            style={{ width: `${((idx + 1) / 6) * 100}%` }}
          />
        </div>
      </div>
    </>
  );
}

function FilterSidebar({
  budget,
  onChangeBudget,
  cats,
  catKey,
  onCat,
  occasion,
  onOccasion,
  productMode,
}) {
  return (
    <aside className="space-y-4 hidden lg:block">
      <div className="rounded-xl border border-[var(--sk-line)] bg-[var(--sk-cream-200)] p-3.5">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white grid place-items-center text-[var(--sk-brown-900)] shrink-0">
            <Gift size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-[var(--sk-ink-500)]">Your Selected Budget</div>
            <div className="font-display font-bold text-[var(--sk-brown-900)] text-lg leading-tight">{inr(budget)}</div>
            <button
              type="button"
              onClick={onChangeBudget}
              className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--sk-gold-400)]"
            >
              <Pencil size={11} /> Change
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--sk-line)] bg-white p-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--sk-ink-400)] px-2 mb-1">
          Shop by Category
        </div>
        <nav className="space-y-0.5">
          {cats.map(({ key, label, Icon }) => {
            const active = catKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onCat(key)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-left transition-colors ${
                  active
                    ? 'bg-[var(--sk-cream-300)] text-[var(--sk-brown-900)] font-semibold'
                    : 'text-[var(--sk-ink-600)] hover:bg-[var(--sk-cream-100)]'
                }`}
              >
                <Icon size={14} className={active ? 'text-[var(--sk-brown-900)]' : 'text-[var(--sk-ink-400)]'} />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="rounded-xl border border-[var(--sk-line)] bg-white p-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--sk-ink-400)] px-2 mb-1">
          Shop by Occasion
        </div>
        <nav className="space-y-0.5">
          {OCCASIONS.map(({ key, label, Icon }) => {
            const active = occasion === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onOccasion(active ? null : key)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-left transition-colors ${
                  active
                    ? 'bg-[var(--sk-cream-300)] text-[var(--sk-brown-900)] font-semibold'
                    : 'text-[var(--sk-ink-600)] hover:bg-[var(--sk-cream-100)]'
                }`}
              >
                <Icon size={14} className={active ? 'text-[var(--sk-brown-900)]' : 'text-[var(--sk-ink-400)]'} />
                {label}
              </button>
            );
          })}
        </nav>
        {productMode && (
          <p className="text-[10px] text-[var(--sk-ink-400)] px-2 mt-2 leading-snug">
            Occasion filters personalise suggestions — all products stay available.
          </p>
        )}
      </div>
    </aside>
  );
}

function HamperSidebar({
  budget,
  spent,
  remaining,
  overBudget,
  chosen,
  itemCount,
  setQty,
  onEditProducts,
  onContinue,
  continueLabel = 'Continue',
  cardStyleObj,
  message,
  showGiftCard,
  onEditGift,
  disableContinue,
}) {
  return (
    <aside className="sk-card p-5 h-fit sticky top-4">
      <div className="flex items-center gap-2 font-display font-bold text-[var(--sk-brown-900)] text-lg tracking-wide">
        <Gift size={18} /> YOUR HAMPER
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--sk-ink-500)]">Budget</span>
          <b className="text-[var(--sk-brown-900)]">{inr(budget)}</b>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--sk-ink-500)]">Spent</span>
          <b className="text-[var(--sk-brown-900)]">{inr(spent)}</b>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[var(--sk-ink-500)]">Remaining</span>
          <b className={overBudget ? 'text-[var(--sk-red-500)]' : 'text-[var(--sk-green-500)]'}>
            {overBudget ? `−${inr(Math.abs(remaining))}` : inr(remaining)}
          </b>
        </div>
      </div>

      <div className="mt-3 h-1.5 rounded-full bg-[var(--sk-cream-300)] overflow-hidden">
        <div
          className={`h-full transition-all ${overBudget ? 'bg-[var(--sk-red-500)]' : 'bg-[var(--sk-brown-900)]'}`}
          style={{ width: `${Math.min(100, (spent / Math.max(budget, 1)) * 100)}%` }}
        />
      </div>

      <div className="mt-4 border-t border-[var(--sk-line)] pt-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-[var(--sk-brown-900)]">Products Added ({itemCount})</span>
          {chosen.length > 0 && onEditProducts && (
            <button type="button" onClick={onEditProducts} className="text-[12px] text-[var(--sk-gold-400)] font-semibold">
              Edit
            </button>
          )}
        </div>
        {chosen.length === 0 ? (
          <p className="text-[12px] text-[var(--sk-ink-400)] py-2">No products yet — add from the grid.</p>
        ) : (
          <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
            {chosen.map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-[13px]">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-[var(--sk-cream-200)] shrink-0">
                  <img src={p.img} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[var(--sk-brown-900)] font-medium truncate">{p.name}</div>
                  <div className="text-[11px] text-[var(--sk-ink-500)]">{p.weight} · {inr(p.price)}</div>
                </div>
                <div className="inline-flex items-center border border-[var(--sk-line-strong)] rounded-md">
                  <button type="button" aria-label="Decrease" onClick={() => setQty(p.id, p.qty - 1)} className="p-1 hover:bg-[var(--sk-cream-200)]">
                    <Minus size={11} />
                  </button>
                  <span className="text-xs w-4 text-center font-semibold">{p.qty}</span>
                  <button type="button" aria-label="Increase" onClick={() => setQty(p.id, p.qty + 1)} className="p-1 hover:bg-[var(--sk-cream-200)]">
                    <Plus size={11} />
                  </button>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${p.name}`}
                  onClick={() => setQty(p.id, 0)}
                  className="text-[var(--sk-red-500)] p-1 hover:bg-red-50 rounded"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--sk-line)] space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--sk-ink-500)]">Total Items</span>
          <b className="text-[var(--sk-brown-900)]">{itemCount}</b>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--sk-ink-500)]">Total Amount</span>
          <b className="text-[var(--sk-brown-900)] text-base">{inr(spent)}</b>
        </div>
      </div>

      {showGiftCard && cardStyleObj && (
        <div className="mt-4 pt-3 border-t border-[var(--sk-line)]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-[var(--sk-brown-900)]">Gift Card</span>
            {onEditGift && (
              <button type="button" onClick={onEditGift} className="text-[12px] text-[var(--sk-gold-400)] font-semibold">Edit</button>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <div className={`w-12 h-10 rounded-md ${cardStyleObj.tone} border border-[var(--sk-line)] grid place-items-center shrink-0`}>
              {cardStyleObj.custom ? <Pencil size={12} /> : <Gift size={12} style={{ color: cardStyleObj.accent }} />}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-[var(--sk-brown-900)] truncate">{cardStyleObj.name}</div>
              <div className="text-[11px] text-[var(--sk-ink-500)] truncate">
                {message ? 'Personalized Message' : 'No message yet'}
              </div>
            </div>
          </div>
        </div>
      )}

      {overBudget && (
        <div className="mt-3 text-[12px] text-[var(--sk-red-500)] font-medium leading-snug">
          Over budget — remove items or increase budget to continue.
        </div>
      )}

      {onContinue && (
        <button
          type="button"
          disabled={disableContinue}
          onClick={onContinue}
          className="sk-btn-primary w-full mt-5 !py-3"
        >
          {continueLabel} <ArrowRight size={14} />
        </button>
      )}

      <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[var(--sk-ink-500)]">
        <ShieldCheck size={12} className="text-[var(--sk-green-500)]" />
        Secure & Safe Checkout
      </div>
    </aside>
  );
}

export default function BuildHamper() {
  const { step: stepParam } = useParams();
  const step = STEPS.includes(stepParam) ? stepParam : 'budget';
  const nav = useNavigate();
  const idx = STEPS.indexOf(step);
  const [state, setState] = useState(() => ({
    budget: 2500,
    budgetConfirmed: false,
    style: STYLES[0].key,
    items: {},
    cardStyle: CARDS[0].key,
    message: '',
    recipient: '',
    ...loadState(),
  }));
  const [catTab, setCatTab] = useState('all');
  const [hamperCat, setHamperCat] = useState('all');
  const [productSideCat, setProductSideCat] = useState('all');
  const [occasion, setOccasion] = useState(null);
  const [sortBy, setSortBy] = useState('popularity');
  const [loading, setLoading] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewReady, setPreviewReady] = useState(false);
  const [done, setDone] = useState(false);
  const [previewThumb, setPreviewThumb] = useState(0);
  const { add } = useCart();

  const setPersist = (patch) => {
    setState((s) => {
      const next = { ...s, ...patch };
      localStorage.setItem(LS, JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (!STEPS.includes(stepParam)) nav('/build-hamper/budget', { replace: true });
  }, [stepParam, nav]);

  useEffect(() => {
    if (idx <= 0) return;
    const stored = loadState();
    const ok = Boolean(state.budgetConfirmed || stored.budgetConfirmed) && Number(state.budget || stored.budget) > 0;
    if (!ok) nav('/build-hamper/budget', { replace: true });
  }, [idx, state.budgetConfirmed, state.budget, nav]);

  useEffect(() => {
    if (step !== 'preview') {
      setPreviewProgress(0);
      setPreviewReady(false);
      return undefined;
    }
    setPreviewProgress(0);
    setPreviewReady(false);
    const iv = setInterval(() => {
      setPreviewProgress((p) => {
        const next = Math.min(100, p + 3 + Math.floor(Math.random() * 4));
        if (next >= 100) {
          clearInterval(iv);
          setPreviewReady(true);
          return 100;
        }
        return next;
      });
    }, 90);
    return () => clearInterval(iv);
  }, [step]);

  const chosen = useMemo(
    () => MOCK_PRODUCTS.filter((p) => state.items[p.id]).map((p) => ({ ...p, qty: state.items[p.id] })),
    [state.items],
  );
  const styleObj = STYLES.find((s) => s.key === state.style) || STYLES[0];
  const spent = chosen.reduce((s, p) => s + p.price * p.qty, 0);
  const remaining = state.budget - spent;
  const overBudget = remaining < 0;
  const itemCount = chosen.reduce((s, p) => s + p.qty, 0);
  const approx = approxRange(state.budget);
  const cardStyleObj = CARDS.find((c) => c.key === state.cardStyle) || CARDS[0];
  const cartTotal = spent + (styleObj?.price || 0);

  const filteredHampers = useMemo(() => {
    let list = [...STYLES];
    if (hamperCat === 'bestsellers') list = list.filter((_, i) => i < 2);
    else if (hamperCat === 'premium') list = list.filter((s) => s.price >= 2499);
    else if (hamperCat !== 'all') list = list.filter((s) => s.category === hamperCat);
    if (sortBy === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') list.sort((a, b) => b.price - a.price);
    return list;
  }, [hamperCat, sortBy]);

  const filteredProducts = useMemo(() => {
    let list = [...MOCK_PRODUCTS];
    if (productSideCat === 'bestsellers') list = list.filter((p) => p.bestseller);
    else if (productSideCat === 'premium') list = list.filter((p) => p.premium || p.bestseller);
    else if (productSideCat !== 'all') list = list.filter((p) => p.category === productSideCat || (productSideCat === 'dry-fruits' && p.category === 'dates'));

    if (catTab === 'premium') list = list.filter((p) => p.premium || p.bestseller || p.price >= 399);
    else if (catTab === 'dry-fruits') list = list.filter((p) => p.category === 'dry-fruits' || p.category === 'dates');
    else if (catTab !== 'all') list = list.filter((p) => p.category === catTab);

    if (sortBy === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') list.sort((a, b) => b.price - a.price);
    return list;
  }, [catTab, productSideCat, sortBy]);

  const goto = (n) => nav(`/build-hamper/${STEPS[n]}`);

  const setQty = (id, qty) => {
    const next = { ...state.items };
    if (qty <= 0) delete next[id];
    else next[id] = qty;
    setPersist({ items: next });
  };

  const addOne = (p) => setQty(p.id, (state.items[p.id] || 0) + 1);

  const continueFromBudget = () => {
    setPersist({ budgetConfirmed: true, budget: state.budget });
    goto(1);
  };

  const resetWizard = () => {
    localStorage.removeItem(LS);
    setState({
      budget: 2500,
      budgetConfirmed: false,
      style: STYLES[0].key,
      items: {},
      cardStyle: CARDS[0].key,
      message: '',
      recipient: '',
    });
    setDone(false);
    setLoading(false);
    nav('/build-hamper/budget');
  };

  const finish = () => {
    setLoading(true);
    let progress = 0;
    const iv = setInterval(() => {
      progress = Math.min(100, progress + 12);
      setPreviewProgress(progress);
      if (progress >= 100) clearInterval(iv);
    }, 100);
    setTimeout(() => {
      clearInterval(iv);
      const meta = {
        type: 'custom-hamper',
        style: state.style,
        message: state.message,
        recipient: state.recipient,
        cardStyle: state.cardStyle,
        budget: state.budget,
        items: chosen.map((p) => ({ id: p.id, name: p.name, qty: p.qty, price: p.price })),
      };
      add(
        {
          id: `custom_${Date.now()}`,
          name: `Custom Hamper (${styleObj.name})`,
          images: [styleObj.img],
          slug: 'custom-hamper',
          meta,
          price: cartTotal,
        },
        { qty: 1, variant: { w: 'Custom', price: cartTotal }, source: 'custom-hamper' },
      );
      localStorage.removeItem(LS);
      setLoading(false);
      setDone(true);
      setTimeout(() => nav('/cart'), 900);
    }, 1100);
  };

  const subtitles = [
    'Start by selecting your budget and we’ll help create the perfect dry fruit gift.',
    'Create a gift as unique as your loved ones.',
    'Create a gift as unique as your loved ones.',
    'Add a personal touch with a heartfelt gift card.',
    'Review your hamper and proceed to complete your gift.',
    'Your custom hamper is ready.',
  ];

  const previewImages = [styleObj.img, LIFE_BOX, LIFE_TRAY];
  const showRightSidebar = idx >= 2 && idx <= 4;
  const showLeftFilters = idx === 1 || idx === 2;

  return (
    <div className="bg-[var(--sk-cream-100)] min-h-[70vh]">
      <section className="relative overflow-hidden border-b border-[var(--sk-line)] bg-gradient-to-b from-[var(--sk-cream-200)] to-[var(--sk-cream-100)]">
        <div className="sk-container py-7 md:py-9 text-center relative z-10">
          <h1 className="font-display text-3xl md:text-4xl text-[var(--sk-brown-900)] font-bold">
            Build Your Own Hamper
          </h1>
          <p className="text-[var(--sk-ink-600)] mt-2 max-w-xl mx-auto text-sm md:text-base">
            {subtitles[idx]}
          </p>
          <Stepper idx={idx} />
        </div>
      </section>

      <div
        className={`sk-container py-8 md:py-10 ${
          showLeftFilters && showRightSidebar
            ? 'grid lg:grid-cols-[220px_1fr_280px] gap-6'
            : showLeftFilters
              ? 'grid lg:grid-cols-[220px_1fr] gap-6'
              : showRightSidebar
                ? 'grid lg:grid-cols-[1fr_280px] gap-6'
                : ''
        }`}
      >
        {showLeftFilters && (
          <FilterSidebar
            budget={state.budget}
            onChangeBudget={() => goto(0)}
            cats={idx === 1 ? HAMPER_CATS : PRODUCT_CATS}
            catKey={idx === 1 ? hamperCat : productSideCat}
            onCat={idx === 1 ? setHamperCat : setProductSideCat}
            occasion={occasion}
            onOccasion={setOccasion}
            productMode={idx === 2}
          />
        )}

        <div className="min-w-0">
          {/* ——— STEP 1: BUDGET ——— */}
          {step === 'budget' && (
            <div className="relative max-w-3xl mx-auto">
              <LifestyleChrome variant="budget" />
              <div className="relative sk-card p-6 md:p-10 shadow-[var(--sk-shadow-lg)]">
                <h2 className="sk-section-title text-2xl md:text-3xl text-center">Set Your Budget</h2>
                <p className="text-[var(--sk-ink-600)] mt-2 text-center text-sm md:text-base">
                  Choose your budget range and we’ll suggest the best options for you.
                </p>

                <div className="font-display font-bold text-[var(--sk-brown-900)] text-4xl md:text-5xl mt-8 text-center tracking-tight">
                  {inr(state.budget)}{state.budget >= 15000 ? '+' : ''}
                </div>

                <input
                  type="range"
                  min={1000}
                  max={20000}
                  step={100}
                  value={Math.min(20000, state.budget)}
                  onChange={(e) => setPersist({ budget: Number(e.target.value) })}
                  className="w-full mt-6 h-2 accent-[var(--sk-brown-900)] cursor-pointer"
                  aria-label="Budget slider"
                />
                <div className="flex justify-between text-[11px] text-[var(--sk-ink-400)] mt-1">
                  <span>₹1,000</span>
                  <span>₹20,000</span>
                </div>

                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {BUDGETS.map((b) => {
                    const active = b === 15000 ? state.budget >= 15000 : state.budget === b;
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setPersist({ budget: b })}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                          active
                            ? 'bg-[var(--sk-brown-900)] text-white border-[var(--sk-brown-900)] shadow-sm'
                            : 'bg-white text-[var(--sk-brown-900)] border-[var(--sk-line-strong)] hover:bg-[var(--sk-cream-200)]'
                        }`}
                      >
                        {b >= 15000 ? '₹15,000+' : inr(b)}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-7 flex justify-center">
                  <div className="inline-flex items-center gap-2 text-sm text-[var(--sk-brown-900)]">
                    <Gift size={14} />
                    Approx. {approx.low}–{approx.high} premium products in this range
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3 justify-between">
                  <button type="button" onClick={() => nav(-1)} className="sk-btn-outline !py-2.5 !px-5">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button type="button" onClick={continueFromBudget} className="sk-btn-primary !py-2.5 !px-6">
                    Continue <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ——— STEP 2: HAMPER ——— */}
          {step === 'hamper' && (
            <div>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="sk-section-title text-2xl md:text-3xl">Choose Your Hamper</h2>
                  <p className="text-[var(--sk-ink-600)] mt-1 text-sm">Select a hamper that matches your style and budget.</p>
                </div>
                <label className="text-sm text-[var(--sk-ink-600)] flex items-center gap-2">
                  Sort by:
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sk-input !py-1.5 !px-3 !w-auto text-sm"
                  >
                    <option value="popularity">Popularity</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </label>
              </div>

              <div className="lg:hidden mt-4">
                <button
                  type="button"
                  onClick={() => goto(0)}
                  className="w-full rounded-xl border border-[var(--sk-line)] bg-[var(--sk-cream-200)] p-3 flex items-center justify-between text-sm"
                >
                  <span className="text-[var(--sk-ink-500)]">Your Selected Budget</span>
                  <span className="font-bold text-[var(--sk-brown-900)]">{inr(state.budget)} · Change</span>
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {filteredHampers.map((s) => {
                  const selected = state.style === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setPersist({ style: s.key })}
                      className={`sk-card overflow-hidden text-left transition-all ${
                        selected ? 'ring-2 ring-[var(--sk-brown-900)] shadow-[var(--sk-shadow-md)]' : 'hover:shadow-[var(--sk-shadow-md)]'
                      }`}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--sk-cream-200)]">
                        <img src={s.img} alt={s.name} className="w-full h-full object-cover" />
                        <span className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 grid place-items-center text-[var(--sk-ink-400)]">
                          <Heart size={14} />
                        </span>
                        {selected && (
                          <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-[var(--sk-brown-900)] text-white text-[11px] font-semibold px-2 py-1 rounded-full">
                            <Check size={12} /> Selected
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="font-display font-bold text-[var(--sk-brown-900)] text-lg leading-tight">{s.name}</div>
                        <div className="text-[12px] text-[var(--sk-ink-500)] mt-1">{s.type}</div>
                        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[var(--sk-ink-500)]">
                          <span className="inline-flex items-center gap-1"><Box size={12} /> {s.capacity}</span>
                          <span className="inline-flex items-center gap-1"><Gift size={12} /> {s.serves}</span>
                        </div>
                        <div className="mt-2 font-bold text-[var(--sk-brown-900)] text-lg">{inr(s.price)}</div>
                        <div
                          className={`mt-3 w-full text-center text-sm font-semibold py-2.5 rounded-lg ${
                            selected ? 'bg-[var(--sk-brown-900)] text-white' : 'bg-[var(--sk-brown-900)] text-white'
                          }`}
                        >
                          {selected ? 'Selected ✓' : 'Select Hamper'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex gap-3 justify-between">
                <button type="button" onClick={() => goto(0)} className="sk-btn-outline !py-2.5 !px-5">
                  <ArrowLeft size={14} /> Back
                </button>
                <button type="button" onClick={() => goto(2)} className="sk-btn-primary !py-2.5 !px-6">
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ——— STEP 3: PRODUCTS ——— */}
          {step === 'products' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2 overflow-x-auto sk-scroll-x pb-1 flex-1 min-w-0">
                  {PRODUCT_TABS.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setCatTab(t.key)}
                      className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        catTab === t.key
                          ? 'bg-[var(--sk-brown-900)] text-white'
                          : 'bg-white text-[var(--sk-brown-900)] border border-[var(--sk-line-strong)] hover:bg-[var(--sk-cream-200)]'
                      }`}
                    >
                      {t.icon && <Crown size={12} className="text-[var(--sk-gold-400)]" />}
                      {t.label}
                    </button>
                  ))}
                </div>
                <label className="text-sm text-[var(--sk-ink-600)] flex items-center gap-2 shrink-0">
                  Sort by:
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sk-input !py-1.5 !px-3 !w-auto text-sm"
                  >
                    <option value="popularity">Popularity</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </label>
              </div>

              <div className="mt-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {filteredProducts.map((p) => {
                  const qty = state.items[p.id] || 0;
                  const added = qty > 0;
                  return (
                    <div key={p.id} className="sk-card overflow-hidden flex flex-col">
                      <div className="relative aspect-square bg-[var(--sk-cream-200)]">
                        <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                        {p.bestseller && (
                          <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wide bg-orange-500 text-white px-2 py-0.5 rounded-full">
                            Bestseller
                          </span>
                        )}
                        {p.premium && !p.bestseller && (
                          <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wide bg-[var(--sk-gold-400)] text-white px-2 py-0.5 rounded-full">
                            Premium
                          </span>
                        )}
                        <span className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 grid place-items-center text-[var(--sk-ink-400)]">
                          <Heart size={14} />
                        </span>
                      </div>
                      <div className="p-3 flex flex-col flex-1">
                        <div className="font-display font-bold text-[var(--sk-brown-900)] text-sm leading-snug line-clamp-2">{p.name}</div>
                        <div className="text-[12px] text-[var(--sk-ink-600)] mt-1 font-semibold">
                          {inr(p.price)} <span className="font-normal text-[var(--sk-ink-400)]">/ {p.weight}</span>
                        </div>

                        {added ? (
                          <div className="mt-auto pt-3 flex items-center gap-2">
                            <div className="inline-flex items-center gap-1 border border-[var(--sk-line-strong)] rounded-lg flex-1 justify-center">
                              <button type="button" aria-label="Decrease" onClick={() => setQty(p.id, qty - 1)} className="p-1.5 hover:bg-[var(--sk-cream-200)] rounded-l-lg"><Minus size={12} /></button>
                              <span className="text-sm w-5 text-center font-semibold">{qty}</span>
                              <button type="button" aria-label="Increase" onClick={() => addOne(p)} className="p-1.5 hover:bg-[var(--sk-cream-200)] rounded-r-lg"><Plus size={12} /></button>
                            </div>
                            <span className="shrink-0 text-[11px] font-bold text-white bg-[var(--sk-brown-900)] px-2.5 py-2 rounded-lg inline-flex items-center gap-0.5">
                              Added <Check size={12} strokeWidth={3} />
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addOne(p)}
                            className="mt-auto pt-3 w-full text-sm font-semibold py-2 rounded-lg bg-[var(--sk-brown-900)] text-white hover:bg-[var(--sk-brown-700)] transition-colors"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-[var(--sk-ink-500)]">No products in this category yet.</div>
              )}

              {overBudget && (
                <div className="mt-5 text-sm text-[var(--sk-red-500)] font-medium bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  You’re over budget by {inr(Math.abs(remaining))}. Remove items or{' '}
                  <button type="button" className="underline font-semibold" onClick={() => goto(0)}>increase your budget</button> to continue.
                </div>
              )}

              <div className="mt-8 flex gap-3 lg:hidden">
                <button type="button" onClick={() => goto(1)} className="sk-btn-outline flex-1 !py-2.5">
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  type="button"
                  disabled={overBudget || chosen.length === 0}
                  onClick={() => goto(3)}
                  className="sk-btn-primary flex-1 !py-2.5"
                >
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ——— STEP 4: GIFT CARD ——— */}
          {step === 'gift-card' && (
            <div className="relative">
              <LifestyleChrome variant="gift" />
              <div className="relative">
                <h2 className="sk-section-title text-2xl md:text-3xl">Choose Your Gift Card</h2>
                <p className="text-[var(--sk-ink-600)] mt-1 text-sm">Select a card design or create your own.</p>

                <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {CARDS.map((c) => {
                    const selected = state.cardStyle === c.key;
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setPersist({ cardStyle: c.key })}
                        className={`relative rounded-xl overflow-hidden text-left border-2 transition-all aspect-[4/3] ${
                          c.custom ? 'border-dashed' : ''
                        } ${
                          selected
                            ? 'border-[var(--sk-brown-900)] shadow-[var(--sk-shadow-md)]'
                            : 'border-[var(--sk-line)] hover:border-[var(--sk-line-strong)]'
                        } ${c.tone}`}
                      >
                        {selected && (
                          <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[var(--sk-brown-900)] text-white grid place-items-center">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                          {c.custom ? (
                            <Pencil size={22} className="text-[var(--sk-brown-900)] mb-2" />
                          ) : (
                            <Flower2 size={22} style={{ color: c.accent }} className="mb-2 opacity-80" />
                          )}
                          <span className="text-[12px] font-semibold text-[var(--sk-brown-900)] leading-snug">{c.name}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="sk-section-title text-xl">Personalize Your Message</h3>
                    <p className="text-[var(--sk-ink-600)] mt-1 text-sm">Add a heartfelt message for your loved one.</p>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="font-semibold text-[var(--sk-brown-900)] text-sm">Your Message (Max 150 characters)</label>
                        <textarea
                          value={state.message}
                          onChange={(e) => setPersist({ message: e.target.value.slice(0, 150) })}
                          rows={4}
                          className="sk-input mt-2 resize-none"
                          placeholder="e.g. Wishing you joy this festive season"
                          maxLength={150}
                        />
                        <div className={`text-[11px] text-right mt-1 ${state.message.length >= 150 ? 'text-[var(--sk-red-500)]' : 'text-[var(--sk-ink-500)]'}`}>
                          {state.message.length}/150
                        </div>
                      </div>
                      <div>
                        <label className="font-semibold text-[var(--sk-brown-900)] text-sm">
                          Recipient Name <span className="text-[var(--sk-ink-400)] font-normal">(Optional)</span>
                        </label>
                        <input
                          value={state.recipient}
                          onChange={(e) => setPersist({ recipient: e.target.value })}
                          className="sk-input mt-2"
                          placeholder="e.g. Rahul Sharma"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="sk-section-title text-xl">Preview</h3>
                    <p className="text-[var(--sk-ink-600)] mt-1 text-sm">This is how your gift card will look.</p>
                    <div className={`mt-4 rounded-2xl border border-[var(--sk-line)] overflow-hidden ${cardStyleObj.tone} min-h-[220px] relative p-6 shadow-[var(--sk-shadow-md)]`}>
                      <div className="text-center text-[10px] tracking-[0.2em] uppercase font-bold text-[var(--sk-brown-900)]/70">
                        Sukhmal Dry Fruits Korner
                      </div>
                      <div className="mt-6 font-display text-2xl text-[var(--sk-brown-900)]" style={{ color: cardStyleObj.accent }}>
                        {cardStyleObj.name === 'Create Your Own' ? 'Your Custom Card' : cardStyleObj.name}
                      </div>
                      {state.recipient && (
                        <div className="mt-3 text-sm font-semibold text-[var(--sk-brown-900)]">To {state.recipient}</div>
                      )}
                      <p className="mt-3 text-sm text-[var(--sk-ink-600)] leading-relaxed max-w-xs">
                        {state.message || '— your message will appear here —'}
                      </p>
                      <div className="mt-6 text-[12px] text-[var(--sk-ink-500)] italic">With love, from Sukhmal</div>
                      <Flower2 size={64} className="absolute right-4 bottom-4 opacity-20" style={{ color: cardStyleObj.accent }} />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3 justify-between">
                  <button type="button" onClick={() => goto(2)} className="sk-btn-outline !py-2.5 !px-5">
                    <ArrowLeft size={14} /> Back to Products
                  </button>
                  <button
                    type="button"
                    disabled={overBudget || chosen.length === 0}
                    onClick={() => goto(4)}
                    className="sk-btn-primary !py-2.5 !px-6 lg:hidden"
                  >
                    Continue to Preview <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ——— STEP 5: PREVIEW ——— */}
          {step === 'preview' && (
            <div className="relative">
              {!previewReady ? (
                <div className="relative max-w-3xl mx-auto">
                  <LifestyleChrome variant="preview" />
                  <div className="relative sk-card p-6 md:p-10 text-center shadow-[var(--sk-shadow-lg)]">
                    <div className="py-6 space-y-5">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--sk-cream-300)] grid place-items-center text-[var(--sk-brown-900)]">
                        <Gift size={32} />
                      </div>
                      <h2 className="sk-section-title text-2xl md:text-3xl">A Glimpse of Your Masterpiece</h2>
                      <p className="text-[var(--sk-ink-600)] text-sm">Please wait while we prepare your hamper preview…</p>
                      <div className="max-w-md mx-auto pt-2">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2.5 rounded-full bg-[var(--sk-cream-300)] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-150"
                              style={{
                                width: `${previewProgress}%`,
                                background: 'linear-gradient(90deg, var(--sk-brown-900), var(--sk-gold-400))',
                              }}
                            />
                          </div>
                          <span className="font-semibold text-[var(--sk-brown-900)] text-sm w-10 text-right">{previewProgress}%</span>
                        </div>
                        <div className="mt-2 text-[12px] text-[var(--sk-ink-500)] text-left">
                          We’re arranging everything beautifully for you.
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2 justify-center">
                      <button type="button" onClick={() => goto(3)} className="sk-btn-outline !py-2.5 !px-4 text-sm rounded-full">
                        <ArrowLeft size={14} /> Back
                      </button>
                      <button type="button" onClick={() => goto(2)} className="sk-btn-outline !py-2.5 !px-4 text-sm rounded-full">
                        <Pencil size={14} /> Redesign Hamper
                      </button>
                      <button type="button" onClick={resetWizard} className="sk-btn-outline !py-2.5 !px-4 text-sm rounded-full">
                        <Gift size={14} /> Create Another Hamper
                      </button>
                      <button type="button" disabled className="sk-btn-primary !py-2.5 !px-5 text-sm rounded-full opacity-40">
                        Confirm & Proceed <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <LifestyleChrome variant="preview" />
                  <div className="relative sk-card p-5 md:p-7 shadow-[var(--sk-shadow-md)]">
                    <h2 className="sk-section-title text-xl md:text-2xl">Hamper Preview</h2>

                    <div className="mt-5 grid md:grid-cols-[1.1fr_1fr] gap-6">
                      <div>
                        <div className="aspect-square rounded-2xl overflow-hidden bg-[var(--sk-cream-200)]">
                          <img src={previewImages[previewThumb]} alt={styleObj.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="Previous image"
                            onClick={() => setPreviewThumb((t) => (t + previewImages.length - 1) % previewImages.length)}
                            className="w-8 h-8 rounded-full border border-[var(--sk-line-strong)] grid place-items-center text-[var(--sk-brown-900)]"
                          >
                            <ArrowLeft size={14} />
                          </button>
                          {previewImages.map((src, i) => (
                            <button
                              key={src}
                              type="button"
                              onClick={() => setPreviewThumb(i)}
                              className={`w-14 h-14 rounded-lg overflow-hidden border-2 ${
                                previewThumb === i ? 'border-[var(--sk-brown-900)]' : 'border-transparent'
                              }`}
                            >
                              <img src={src} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                          <button
                            type="button"
                            aria-label="Next image"
                            onClick={() => setPreviewThumb((t) => (t + 1) % previewImages.length)}
                            className="w-8 h-8 rounded-full border border-[var(--sk-line-strong)] grid place-items-center text-[var(--sk-brown-900)]"
                          >
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4 text-sm">
                        <div className="flex justify-between gap-3 border-b border-[var(--sk-line)] pb-2">
                          <div>
                            <div className="text-[11px] text-[var(--sk-ink-400)] uppercase tracking-wide">Hamper Name</div>
                            <div className="font-display font-bold text-[var(--sk-brown-900)] text-lg">Premium Harmony Hamper</div>
                          </div>
                          <button type="button" onClick={() => goto(2)} className="text-[var(--sk-gold-400)] font-semibold text-xs inline-flex items-center gap-1 h-fit">
                            <Pencil size={11} /> Edit
                          </button>
                        </div>
                        <div className="flex justify-between gap-3 border-b border-[var(--sk-line)] pb-2">
                          <div>
                            <div className="text-[11px] text-[var(--sk-ink-400)] uppercase tracking-wide">Hamper Type</div>
                            <div className="font-semibold text-[var(--sk-brown-900)]">{styleObj.name}</div>
                            <div className="text-[12px] text-[var(--sk-ink-500)]">{styleObj.type}</div>
                          </div>
                          <button type="button" onClick={() => goto(1)} className="text-[var(--sk-gold-400)] font-semibold text-xs inline-flex items-center gap-1 h-fit">
                            <Pencil size={11} /> Edit
                          </button>
                        </div>
                        <div className="border-b border-[var(--sk-line)] pb-3">
                          <div className="flex justify-between items-start">
                            <div className="text-[11px] text-[var(--sk-ink-400)] uppercase tracking-wide">Gift Card</div>
                            <button type="button" onClick={() => goto(3)} className="text-[var(--sk-gold-400)] font-semibold text-xs inline-flex items-center gap-1">
                              <Pencil size={11} /> Edit
                            </button>
                          </div>
                          <div className="mt-2 flex gap-3">
                            <div className={`w-14 h-12 rounded-md ${cardStyleObj.tone} border border-[var(--sk-line)] shrink-0 grid place-items-center`}>
                              <Flower2 size={16} style={{ color: cardStyleObj.accent }} />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-[var(--sk-brown-900)]">{cardStyleObj.name}</div>
                              <div className="text-[12px] text-[var(--sk-ink-500)] mt-0.5">Personalized Message</div>
                              <p className="text-[13px] text-[var(--sk-ink-600)] mt-1 line-clamp-3">
                                {state.message || 'No message added'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                          {[
                            { Icon: HandHeart, t: 'Handpicked with Care' },
                            { Icon: Package, t: 'Hygienically Packed' },
                            { Icon: Crown, t: 'Premium Quality' },
                            { Icon: Sparkles, t: 'Perfect for Every Occasion' },
                          ].map(({ Icon, t }) => (
                            <div key={t} className="flex items-center gap-2 text-[11px] text-[var(--sk-ink-600)]">
                              <Icon size={14} className="text-[var(--sk-gold-400)] shrink-0" />
                              {t}
                            </div>
                          ))}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-2 pt-2">
                          <div className="rounded-xl bg-[var(--sk-cream-200)] px-3 py-2.5 flex items-start gap-2 text-[12px]">
                            <Truck size={16} className="text-[var(--sk-brown-900)] shrink-0 mt-0.5" />
                            <span><b className="text-[var(--sk-brown-900)]">Estimated Delivery</b><br />2 - 4 Working Days</span>
                          </div>
                          <div className="rounded-xl bg-[var(--sk-cream-200)] px-3 py-2.5 flex items-start gap-2 text-[12px]">
                            <ShieldCheck size={16} className="text-[var(--sk-brown-900)] shrink-0 mt-0.5" />
                            <span><b className="text-[var(--sk-brown-900)]">Secure Packaging</b><br />Safe & Reliable Delivery</span>
                          </div>
                        </div>

                        {overBudget && (
                          <div className="text-[var(--sk-red-500)] font-medium text-sm">
                            Over budget by {inr(Math.abs(remaining))} — redesign before confirming.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      <button type="button" onClick={() => goto(3)} className="sk-btn-outline !py-2.5 !px-4 text-sm">
                        <ArrowLeft size={14} /> Back to Gift Card
                      </button>
                      <button type="button" onClick={() => goto(2)} className="sk-btn-outline !py-2.5 !px-4 text-sm">
                        <Pencil size={14} /> Redesign Hamper
                      </button>
                      <button type="button" onClick={resetWizard} className="sk-btn-outline !py-2.5 !px-4 text-sm">
                        <Gift size={14} /> Create Another Hamper
                      </button>
                      <button
                        type="button"
                        disabled={overBudget || chosen.length === 0}
                        onClick={() => goto(5)}
                        className="sk-btn-primary !py-2.5 !px-5 text-sm lg:hidden"
                      >
                        Confirm & Proceed <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ——— STEP 6: CONFIRM ——— */}
          {step === 'confirm' && (
            <div className="max-w-lg mx-auto text-center py-10 md:py-14">
              {loading ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-[var(--sk-cream-300)] grid place-items-center">
                    <Gift className="animate-pulse text-[var(--sk-brown-900)]" size={28} />
                  </div>
                  <div className="font-display text-2xl text-[var(--sk-brown-900)] font-bold">Adding to your cart…</div>
                  <div className="max-w-xs mx-auto">
                    <div className="h-2 rounded-full bg-[var(--sk-cream-300)] overflow-hidden">
                      <div className="h-full bg-[var(--sk-brown-900)] transition-all" style={{ width: `${previewProgress}%` }} />
                    </div>
                    <div className="text-[12px] text-[var(--sk-ink-500)] mt-1">{previewProgress}%</div>
                  </div>
                </div>
              ) : done ? (
                <div>
                  <Sparkles size={40} className="text-[var(--sk-gold-400)] mx-auto" />
                  <h2 className="sk-section-title text-3xl mt-3">All Set!</h2>
                  <p className="text-[var(--sk-ink-600)] mt-2">Taking you to your cart…</p>
                </div>
              ) : (
                <div>
                  <div className="w-20 h-20 mx-auto rounded-full bg-[var(--sk-green-100)] grid place-items-center">
                    <Check size={36} className="text-[var(--sk-green-500)]" strokeWidth={2.5} />
                  </div>
                  <h2 className="sk-section-title text-3xl mt-4">Hamper Complete</h2>
                  <p className="text-[var(--sk-ink-600)] mt-2">
                    Your {styleObj.name.toLowerCase()} with {itemCount} item{itemCount === 1 ? '' : 's'} ({inr(cartTotal)}) is ready.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--sk-ink-600)] bg-white border border-[var(--sk-line)] rounded-xl px-4 py-2">
                    <img src={styleObj.img} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    <span className="font-semibold text-[var(--sk-brown-900)]">{styleObj.name}</span>
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3 justify-center">
                    <button type="button" onClick={() => goto(4)} className="sk-btn-outline">
                      <ArrowLeft size={14} /> Back to Preview
                    </button>
                    <button type="button" onClick={finish} className="sk-btn-primary">
                      <Gift size={16} /> Add to Cart
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {showRightSidebar && (
          <div className="hidden lg:block">
            <HamperSidebar
              budget={state.budget}
              spent={spent}
              remaining={remaining}
              overBudget={overBudget}
              chosen={chosen}
              itemCount={itemCount}
              setQty={setQty}
              onEditProducts={idx !== 2 ? () => goto(2) : undefined}
              onContinue={
                idx === 2
                  ? () => goto(3)
                  : idx === 3
                    ? () => goto(4)
                    : idx === 4 && previewReady
                      ? () => goto(5)
                      : undefined
              }
              continueLabel={
                idx === 3 ? 'Continue to Preview' : idx === 4 ? 'Confirm & Proceed' : 'Continue'
              }
              cardStyleObj={cardStyleObj}
              message={state.message}
              showGiftCard={idx >= 3}
              onEditGift={idx !== 3 ? () => goto(3) : undefined}
              disableContinue={
                overBudget
                || chosen.length === 0
                || (idx === 4 && !previewReady)
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
