import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { inr } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { verifiedImg } from '@/data/verifiedImages';
import { requestHamperPreview } from '@/lib/hamperImageCloud';
import { saveHamperBuild } from '@/lib/commerceStore';
import { listHamperBuilderProducts, mapHamperBuilderProduct, subscribeLiveProducts } from '@/lib/liveCatalog';
import { HAMPERS } from '@/data/mockCatalog';
import {
  ArrowLeft, ArrowRight, Sparkles, Plus, Minus, Check, X, Gift, ShieldCheck,
  Crown, Heart, Pencil, Truck, Package, Leaf, Star, Box, ShoppingBag,
  PartyPopper, Briefcase, Cake, HandHeart, Flower2, LayoutGrid, Sparkle, Hand,
} from 'lucide-react';

const STEPS = ['budget', 'hamper', 'products', 'gift-card', 'preview', 'confirm'];
const LABELS = ['Budget', 'Hampers', 'Products', 'Gift Card', 'Preview', 'Confirm'];
const BUDGETS = [1000, 2500, 5000, 7500, 10000, 15000];
const LS = 'sk_hamper_wizard_v2';

const LIFE_NUTS = verifiedImg('nuts', 480);
const LIFE_BOX = '/brand/hero-luxury-hamper-v2.png';
const LIFE_TRAY = '/brand/byoh-lifestyle.png';
const LIFE_RIBBON = verifiedImg('royal-gold', 360);

const PACKAGING_TYPE = {
  basket: 'Woven Basket',
  box: 'Gift Box',
  tray: 'Tray / Stand',
};

const BESTSELLER_HAMPER_SLUGS = new Set([
  'silver-crystal-tray',
  'pearl-namkeen-basket',
  'classic-four-nut-basket',
  'grand-celebration-basket',
  'royal-copper-tray',
]);

const STYLES = HAMPERS.map((h) => {
  const fillCount = (h.contents || []).filter((c) => {
    const s = String(c);
    if (/\d+\s*(g|kg|boxes?)/i.test(s)) return true;
    return !/(tray|basket|box|stand|ganesh|diya)/i.test(s);
  }).length;
  const kind = h.packagingKind || 'basket';
  return {
    key: h.slug,
    name: h.name,
    type: h.packaging || PACKAGING_TYPE[kind] || 'Hamper',
    category: kind === 'stand' ? 'tray' : kind,
    tier: h.tier,
    capacity: `${fillCount} Item${fillCount === 1 ? '' : 's'}`,
    serves: h.weight,
    price: Number(h.trayPrice) || 0,
    img: h.image,
    bestseller: BESTSELLER_HAMPER_SLUGS.has(h.slug),
  };
});

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
  { key: 'all', label: 'All Hampers', productLabel: 'All Products', Icon: LayoutGrid },
  { key: 'bestsellers', label: 'Bestsellers', Icon: Star },
  { key: 'premium', label: 'Premium Hampers', Icon: Crown },
  { key: 'luxury', label: 'Luxury Hampers', Icon: Sparkle },
  { key: 'tray', label: 'Tray Hampers', Icon: Box },
  { key: 'basket', label: 'Basket Hampers', Icon: ShoppingBag },
  { key: 'box', label: 'Box Hampers', Icon: Gift },
];

const OCCASIONS = [
  { key: 'festivals', label: 'Festivals', Icon: PartyPopper },
  { key: 'weddings', label: 'Weddings', Icon: Flower2 },
  { key: 'corporate', label: 'Corporate Gifting', Icon: Briefcase },
  { key: 'birthday', label: 'Birthday', Icon: Cake },
  { key: 'thanks', label: 'Thank You', Icon: HandHeart },
  { key: 'special', label: 'Special Moments', Icon: Sparkles },
];

function hamperProductLabel(p) {
  const weight = p.weight || p.variants?.[0]?.w || p.variants?.[0]?.weight || '';
  const qty = Number(p.qty) > 1 ? ` ×${p.qty}` : '';
  return `${p.name}${weight ? ` ${weight}` : ''}${qty}`.trim();
}

const MOCK_PRODUCTS = [
  { id: 'mp1', slug: 'badam-cf', name: 'California Almonds', price: 299, weight: '250g', category: 'nuts', bestseller: true, img: '/products/badam-cf-1.jpg' },
  { id: 'mp2', slug: 'kaju-320-n', name: 'Premium Cashews', price: 349, weight: '250g', category: 'nuts', bestseller: true, img: '/products/kaju-320-n-1.jpg' },
  { id: 'mp3', slug: 'pista', name: 'Pistachios (Roasted)', price: 399, weight: '250g', category: 'nuts', premium: true, img: '/products/pista-1.jpg' },
  { id: 'mp4', slug: 'walnut-premium', name: 'Walnut Kernels', price: 379, weight: '250g', category: 'nuts', img: '/products/walnut-premium-1.jpg' },
  { id: 'mp5', slug: 'medjoul-dates', name: 'Premium Medjool Dates', price: 449, weight: '250g', category: 'dates', bestseller: true, premium: true, img: '/products/medjoul-dates-1.jpg' },
  { id: 'mp6', slug: 'kishmish-indian', name: 'Golden Raisins', price: 199, weight: '250g', category: 'dry-fruits', img: '/products/kishmish-indian-1.jpg' },
  { id: 'mp7', slug: 'cranberries', name: 'Dried Cranberries', price: 279, weight: '200g', category: 'berries', img: '/products/cranberries-1.jpg' },
  { id: 'mp8', slug: 'blue-berry', name: 'Blueberry Delight', price: 329, weight: '200g', category: 'berries', premium: true, img: '/products/blue-berry-1.jpg' },
  { id: 'mp9', slug: 'pumpkin-seeds', name: 'Pumpkin Seeds', price: 249, weight: '250g', category: 'seeds', img: '/products/pumpkin-seeds-1.jpg' },
  { id: 'mp10', slug: 'chia-seeds', name: 'Chia Seeds', price: 229, weight: '250g', category: 'seeds', img: '/products/chia-seeds-1.jpg' },
  { id: 'mp11', slug: 'medjoul-dates', name: 'Ajwa Dates', price: 599, weight: '250g', category: 'dates', premium: true, img: '/products/medjoul-dates-1.jpg' },
  { id: 'mp12', slug: 'badam-roasted', name: 'Dark Chocolate Almonds', price: 399, weight: '200g', category: 'chocolate', bestseller: true, img: '/products/badam-roasted-1.jpg' },
];

function HamperProductSkeleton() {
  return (
    <div className="rounded-xl border border-[#E8E4DF] bg-white overflow-hidden animate-pulse" aria-hidden>
      <div className="aspect-square bg-[#EFE8DC]" />
      <div className="p-2.5 space-y-2">
        <div className="h-3.5 bg-[#EFE8DC] rounded w-4/5" />
        <div className="h-3 bg-[#EFE8DC] rounded w-1/3" />
        <div className="h-8 bg-[#EFE8DC] rounded-full mt-2" />
      </div>
    </div>
  );
}

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS)) || {};
    if (raw.style && !STYLES.some((s) => s.key === raw.style)) delete raw.style;
    return raw;
  } catch {
    return {};
  }
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
                  i <= idx
                    ? 'bg-[var(--sk-espresso)] text-white shadow-sm'
                    : 'bg-white text-[var(--sk-ink-400)] border border-[#E8E4DF]'
                }`}
              >
                {i < idx ? <Check size={14} strokeWidth={3} /> : i + 1}
              </div>
              <div className={`text-[11px] mt-1.5 ${i === idx ? 'text-[var(--sk-espresso)] font-bold' : i < idx ? 'text-[var(--sk-espresso)] font-medium' : 'text-[var(--sk-ink-400)]'}`}>
                {LABELS[i]}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-7 lg:w-10 h-[2px] mb-5 ${i < idx ? 'bg-[var(--sk-espresso)]' : 'bg-[#E8E4DF]'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="md:hidden mt-5 max-w-sm mx-auto">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--sk-espresso)] font-semibold">Step {idx + 1} of 6</span>
          <span className="text-[var(--sk-ink-500)]">{LABELS[idx]}</span>
        </div>
        <div className="h-2 mt-2 rounded-full bg-white overflow-hidden border border-[#E8E4DF]">
          <div
            className="h-full bg-[var(--sk-espresso)] transition-all duration-300"
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
      <div className="rounded-2xl border border-[#E8E4DF] bg-white p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FDF6E7] grid place-items-center text-[var(--sk-gold-600)] shrink-0">
            <Gift size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="text-[12px] text-[var(--sk-ink-500)]">Your Selected Budget</div>
              <button
                type="button"
                onClick={onChangeBudget}
                className="text-[12px] font-semibold text-[var(--sk-gold-600)] hover:underline shrink-0"
              >
                Change
              </button>
            </div>
            <div className="font-display font-bold text-[var(--sk-espresso)] text-xl leading-tight mt-0.5">{inr(budget)}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E8E4DF] bg-white p-3.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--sk-ink-400)] px-2 mb-1.5">
          Shop by Category
        </div>
        <nav className="space-y-0.5">
          {cats.map((c) => {
            const { key, Icon } = c;
            const label = productMode && c.productLabel ? c.productLabel : c.label;
            const active = catKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onCat(key)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-left transition-colors ${
                  active
                    ? 'bg-[#FDF6E7] text-[var(--sk-espresso)] font-semibold'
                    : 'text-[var(--sk-ink-600)] hover:bg-[#FAFAF8]'
                }`}
              >
                <Icon size={14} className={active ? 'text-[var(--sk-gold-600)]' : 'text-[var(--sk-gold-600)]/70'} />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="rounded-2xl border border-[#E8E4DF] bg-white p-3.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--sk-ink-400)] px-2 mb-1.5">
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
                    ? 'bg-[#FDF6E7] text-[var(--sk-espresso)] font-semibold'
                    : 'text-[var(--sk-ink-600)] hover:bg-[#FAFAF8]'
                }`}
              >
                <Icon size={14} className="text-[var(--sk-gold-600)]" />
                {label}
              </button>
            );
          })}
        </nav>
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
    <aside className="bg-white rounded-2xl border border-[#E8E4DF] p-5 h-fit sticky top-24 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-2 font-bold text-[var(--sk-espresso)] text-[13px] tracking-[0.14em] uppercase">
        <Gift size={16} className="text-[var(--sk-gold-600)]" /> YOUR HAMPER
      </div>

      <div className="mt-4 text-sm divide-y divide-[#E8E4DF] border-y border-[#E8E4DF]">
        <div className="flex justify-between py-2.5">
          <span className="text-[var(--sk-ink-500)]">Budget</span>
          <b className="text-[var(--sk-espresso)]">{inr(budget)}</b>
        </div>
        <div className="flex justify-between py-2.5">
          <span className="text-[var(--sk-ink-500)]">Spent</span>
          <b className="text-[var(--sk-espresso)]">{inr(spent)}</b>
        </div>
        <div className="flex justify-between items-center py-2.5">
          <span className="text-[var(--sk-ink-500)]">Remaining</span>
          <b className={overBudget ? 'text-[var(--sk-red-500)]' : 'text-[#3A7D44]'}>
            {overBudget ? `−${inr(Math.abs(remaining))}` : inr(remaining)}
          </b>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-[var(--sk-espresso)]">Products Added ({itemCount})</span>
          {chosen.length > 0 && onEditProducts && (
            <button type="button" onClick={onEditProducts} className="text-[12px] text-[var(--sk-gold-600)] font-semibold hover:underline">
              Edit
            </button>
          )}
        </div>
        {chosen.length === 0 ? (
          <p className="text-[12px] text-[var(--sk-ink-400)] py-2">No products yet — add from the grid.</p>
        ) : (
          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {chosen.map((p) => (
              <div key={p.id} className="flex items-start gap-2.5">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#F7F3EC] shrink-0">
                  <img src={p.img} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-[var(--sk-espresso)] font-semibold truncate leading-tight">{p.name}</div>
                  <div className="text-[11px] text-[var(--sk-ink-500)] mt-0.5">{p.weight}</div>
                  <div className="text-[13px] font-semibold text-[var(--sk-espresso)] mt-0.5">{inr(p.price)}</div>
                </div>
                <span className="text-sm font-bold text-[var(--sk-espresso)] w-4 text-center pt-0.5">{p.qty}</span>
                <button
                  type="button"
                  aria-label={`Remove ${p.name}`}
                  onClick={() => setQty(p.id, 0)}
                  className="text-[var(--sk-ink-400)] hover:text-[var(--sk-red-500)] p-0.5 mt-0.5"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[#E8E4DF] space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--sk-ink-500)]">Total Items</span>
          <b className="text-[var(--sk-espresso)]">{itemCount}</b>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[var(--sk-ink-500)]">Total Amount</span>
          <b className="text-[var(--sk-espresso)] text-lg font-display">{inr(spent)}</b>
        </div>
      </div>

      {showGiftCard && cardStyleObj && (
        <div className="mt-4 pt-3 border-t border-[#E8E4DF]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-[var(--sk-espresso)]">Gift Card</span>
            {onEditGift && (
              <button type="button" onClick={onEditGift} className="text-[12px] text-[var(--sk-gold-600)] font-semibold">Edit</button>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <div className={`w-12 h-10 rounded-md ${cardStyleObj.tone} border border-[#E8E4DF] grid place-items-center shrink-0`}>
              {cardStyleObj.custom ? <Pencil size={12} /> : <Gift size={12} style={{ color: cardStyleObj.accent }} />}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-[var(--sk-espresso)] truncate">{cardStyleObj.name}</div>
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
          className="sk-btn-hamper w-full mt-5 !py-3.5 text-[15px] disabled:opacity-40 disabled:hover:transform-none disabled:hover:shadow-none"
        >
          {continueLabel} <ArrowRight size={14} />
        </button>
      )}

      <div className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-[var(--sk-ink-400)]">
        <ShieldCheck size={13} className="text-[#3A7D44]" />
        Secure & Safe Checkout
      </div>
    </aside>
  );
}

function WizardTrustStrip() {
  const items = [
    { Ic: Leaf, label: '100% Natural', sub: 'No Preservatives' },
    { Ic: Star, label: 'Premium Quality', sub: 'Finest from Around the World' },
    { Ic: Hand, label: 'Handpicked with Care', sub: 'Hygienically Packed' },
    { Ic: Truck, label: 'Express Delivery', sub: 'Across India' },
  ];
  return (
    <div className="border-t border-[#E8E4DF] bg-white">
      <div className="sk-container py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map(({ Ic, label, sub }) => (
          <div key={label} className="flex items-center gap-3 justify-center text-center md:text-left md:justify-start">
            <Ic size={22} strokeWidth={1.5} className="text-[var(--sk-espresso)] shrink-0" />
            <div>
              <div className="text-[13px] font-semibold text-[var(--sk-espresso)] leading-tight">{label}</div>
              <div className="text-[11px] text-[var(--sk-ink-400)] mt-0.5">{sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
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
  const [sideCat, setSideCat] = useState('all');
  const [occasion, setOccasion] = useState(null);
  const [sortBy, setSortBy] = useState('popularity');
  const [loading, setLoading] = useState(false);
  const [productRows, setProductRows] = useState(() => listHamperBuilderProducts());
  const [productsLoading, setProductsLoading] = useState(false);
  const [catalogTick, setCatalogTick] = useState(0);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewReady, setPreviewReady] = useState(false);
  const [done, setDone] = useState(false);
  const [previewThumb, setPreviewThumb] = useState(0);
  const [generatedPreview, setGeneratedPreview] = useState(null);
  const [generatedViews, setGeneratedViews] = useState([]);
  const [previewNote, setPreviewNote] = useState('');
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const catalogMapRef = useRef(new Map(listHamperBuilderProducts().map((p) => [p.id, p])));

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
    const apply = (rows) => {
      const mapped = (rows || [])
        .map((p) => mapHamperBuilderProduct(p))
        .filter((p) => p?.id);
      if (!mapped.length) return;
      mapped.forEach((p) => catalogMapRef.current.set(p.id, p));
      setProductRows(mapped);
      setProductsLoading(false);
      setCatalogTick((n) => n + 1);
    };
    apply(listHamperBuilderProducts());
    return subscribeLiveProducts(apply, { activeOnly: true });
  }, []);

  const chosen = useMemo(
    () => Object.entries(state.items)
      .map(([id, qty]) => {
        const p = catalogMapRef.current.get(id);
        return p ? { ...p, qty } : null;
      })
      .filter(Boolean),
    [state.items, catalogTick],
  );
  const styleObj = STYLES.find((s) => s.key === state.style) || STYLES[0];

  const generateHamperImage = useCallback(async () => {
    const products = chosen.map(hamperProductLabel).filter(Boolean);
    if (!products.length) {
      setPreviewNote('Add products to your hamper before generating a preview.');
      setPreviewProgress(100);
      setPreviewReady(true);
      return;
    }
    setPreviewProgress(8);
    setPreviewReady(false);
    setGeneratedPreview(null);
    setGeneratedViews([]);
    setPreviewNote('Packing your selected hamper…');
    const iv = setInterval(() => {
      setPreviewProgress((p) => Math.min(88, p + 6 + Math.floor(Math.random() * 5)));
    }, 280);
    try {
      const card = CARDS.find((c) => c.key === state.cardStyle) || CARDS[0];
      const payload = {
        products,
        boxType: styleObj.type || styleObj.name,
        packaging: styleObj.type || styleObj.name,
        hamperId: state.style,
        hamperName: styleObj.name,
        budget: state.budget,
        productSelections: chosen.map((p) => ({
          productId: p.id,
          name: p.name,
          weight: p.weight || p.variants?.[0]?.w || p.variants?.[0]?.weight || '',
          qty: p.qty,
        })),
        giftCard: {
          name: card.custom && state.message ? 'Custom Gift Card' : card.name,
          message: state.message || '',
          recipient: state.recipient || '',
        },
      };
      const r = await requestHamperPreview(payload);
      if (r?.url || r?.views?.length) {
        const views = Array.isArray(r.views) && r.views.length
          ? r.views
          : [{ key: 'front', label: 'Front', url: r.url }];
        setGeneratedViews(views);
        const packed = views.find((v) => v.key === 'front') || views.find((v) => v.key !== 'empty') || views[0];
        setGeneratedPreview(packed?.url || r.url);
        const frontIdx = Math.max(0, views.findIndex((v) => v.key === 'front'));
        setPreviewThumb(frontIdx);
        saveHamperBuild({ hamperId: state.style, previewImageUrl: packed?.url || r.url, bumpGeneration: true });
        setPreviewNote('');
      } else {
        setPreviewNote('Preview generation had trouble, here\'s what\'s inside.');
      }
    } catch (err) {
      const quota = err?.response?.data?.error === 'quota';
      const busy = err?.response?.data?.error === 'busy';
      setPreviewNote(
        quota
          ? 'Image models have no free quota on this Gemini key. Add billing in Google AI Studio (or Vertex AI) to generate hamper photos.'
          : busy
            ? 'The photo studio is busy. Wait a few seconds and tap Generate AI Preview again.'
            : 'Preview generation had trouble, here\'s what\'s inside.',
      );
    } finally {
      clearInterval(iv);
      setPreviewProgress(100);
      setPreviewReady(true);
    }
  }, [chosen, styleObj, state.style, state.budget, state.cardStyle, state.message, state.recipient]);

  useEffect(() => {
    if (step !== 'preview') {
      setPreviewProgress(0);
      setPreviewReady(false);
      setGeneratedViews([]);
      return undefined;
    }
    let cancelled = false;
    const t = window.setTimeout(() => {
      if (!cancelled) generateHamperImage();
    }, 50);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
    // generate once when Preview opens, with the hamper, products, and gift card from this step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  const spent = chosen.reduce((s, p) => s + p.price * p.qty, 0);
  const remaining = state.budget - spent;
  const overBudget = remaining < 0;
  const itemCount = chosen.reduce((s, p) => s + p.qty, 0);
  const approx = approxRange(state.budget);
  const cardStyleObj = CARDS.find((c) => c.key === state.cardStyle) || CARDS[0];
  const cartTotal = spent + (styleObj?.price || 0);

  const filteredHampers = useMemo(() => {
    let list = [...STYLES];
    if (sideCat === 'bestsellers') list = list.filter((s) => s.bestseller);
    else if (sideCat === 'premium') list = list.filter((s) => s.tier === 'Premium' || s.tier === 'Deluxe');
    else if (sideCat === 'luxury') list = list.filter((s) => s.tier === 'Luxury');
    else if (sideCat !== 'all') list = list.filter((s) => s.category === sideCat);
    if (sortBy === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') list.sort((a, b) => b.price - a.price);
    return list;
  }, [sideCat, sortBy]);

  const filteredProducts = useMemo(() => {
    let list = [...productRows];
    if (sideCat === 'bestsellers') list = list.filter((p) => p.bestseller);
    else if (sideCat === 'premium' || sideCat === 'luxury') list = list.filter((p) => p.premium || p.bestseller || p.price >= 399);

    if (catTab === 'premium') list = list.filter((p) => p.premium || p.bestseller || p.price >= 399);
    else if (catTab === 'dry-fruits') list = list.filter((p) => p.category === 'dry-fruits' || p.category === 'dates');
    else if (catTab !== 'all') list = list.filter((p) => p.category === catTab);

    if (sortBy === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (sortBy === 'popularity') list.sort((a, b) => Number(!!b.bestseller) - Number(!!a.bestseller) || b.price - a.price);
    return list;
  }, [productRows, catTab, sideCat, sortBy]);

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

  const previewSlides = generatedViews.length
    ? generatedViews
    : generatedPreview
      ? [{ key: 'front', label: 'Front', url: generatedPreview }]
      : [];
  const showRightSidebar = idx >= 2 && idx <= 4;
  const showLeftFilters = idx >= 1 && idx <= 4;

  return (
    <div className="bg-[#FAFAF8] min-h-[70vh]">
      <section className="relative overflow-hidden border-b border-[#E8E4DF] bg-white">
        <div className="sk-container py-7 md:py-9 text-center relative z-10">
          <div className="mx-auto mb-3 w-11 h-11 rounded-full bg-[#FDF6E7] grid place-items-center text-[var(--sk-gold-600)]">
            <Gift size={20} />
          </div>
          <h1 className="font-display text-[28px] md:text-[32px] text-[var(--sk-espresso)] font-bold leading-tight">
            Build Your Own Hamper
          </h1>
          <p className="text-[var(--sk-ink-500)] mt-2 max-w-xl mx-auto text-sm md:text-[15px]">
            {subtitles[idx]}
          </p>
          <Stepper idx={idx} />
        </div>
      </section>

      <div
        className={`sk-container py-8 md:py-10 ${
          showLeftFilters && showRightSidebar
            ? 'grid lg:grid-cols-[240px_minmax(0,1fr)_300px] gap-6'
            : showLeftFilters
              ? 'grid lg:grid-cols-[240px_minmax(0,1fr)] gap-6'
              : showRightSidebar
                ? 'grid lg:grid-cols-[minmax(0,1fr)_300px] gap-6'
                : ''
        }`}
      >
        {showLeftFilters && (
          <FilterSidebar
            budget={state.budget}
            onChangeBudget={() => goto(0)}
            cats={HAMPER_CATS}
            catKey={sideCat}
            onCat={setSideCat}
            occasion={occasion}
            onOccasion={setOccasion}
            productMode={idx >= 2}
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
                        <div className="text-[12px] text-[var(--sk-ink-500)] mt-1">
                          {s.tier} {s.serves}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[var(--sk-ink-500)]">
                          <span className="inline-flex items-center gap-1"><Box size={12} /> {s.type}</span>
                          <span className="inline-flex items-center gap-1"><Gift size={12} /> {s.capacity}</span>
                        </div>
                        <div className="mt-2 font-bold text-[var(--sk-brown-900)] text-lg">{inr(s.price)}</div>
                        <div className="text-[11px] text-[var(--sk-ink-400)]">Packaging price</div>
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
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 flex-1 min-w-0 items-center">
                  {PRODUCT_TABS.map((t) => {
                    const active = catTab === t.key;
                    const premium = t.key === 'premium';
                    return (
                      <React.Fragment key={t.key}>
                        {premium && <span className="hidden sm:block w-px h-5 bg-[#E8E4DF] mx-1 shrink-0" />}
                        <button
                          type="button"
                          onClick={() => setCatTab(t.key)}
                          className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-[7px] rounded-full text-sm font-medium transition-colors ${
                            premium
                              ? 'bg-white text-[var(--sk-gold-600)] border border-[var(--sk-gold-600)]'
                              : active
                                ? 'bg-[var(--sk-espresso)] text-white'
                                : 'bg-white text-[var(--sk-espresso)] border border-[#E8E4DF] hover:bg-[#FAFAF8]'
                          } ${premium && active ? 'bg-[#FDF6E7]' : ''}`}
                        >
                          {t.icon && <Crown size={13} />}
                          {t.label}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
                <label className="text-sm text-[var(--sk-ink-500)] flex items-center gap-2 shrink-0">
                  Sort by:
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white border border-[#E8E4DF] rounded-lg text-sm text-[var(--sk-espresso)] py-1.5 px-3 outline-none focus:border-[var(--sk-espresso)]"
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
                  className="w-full rounded-2xl border border-[#E8E4DF] bg-white p-3 flex items-center justify-between text-sm"
                >
                  <span className="text-[var(--sk-ink-500)]">Your Selected Budget</span>
                  <span className="font-bold text-[var(--sk-espresso)]">{inr(state.budget)} · <span className="text-[var(--sk-gold-600)] font-semibold">Change</span></span>
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {productsLoading
                  ? Array.from({ length: 8 }).map((_, i) => <HamperProductSkeleton key={`sk-${i}`} />)
                  : filteredProducts.map((p) => {
                  const qty = state.items[p.id] || 0;
                  const added = qty > 0;
                  const wished = has(p.id);
                  const href = `/product/${p.slug || p.id}`;
                  const frontImg = p.img || `/products/${p.slug}-1.jpg`;
                  return (
                    <div
                      key={p.id}
                      className="rounded-xl bg-white border border-[#E8E4DF] overflow-hidden flex flex-col shadow-[0_1px_2px_rgba(60,36,21,0.04)] hover:shadow-[0_8px_20px_rgba(60,36,21,0.08)] transition-shadow"
                    >
                      <div className="relative aspect-square bg-[#F4EDE3] overflow-hidden">
                        <Link to={href} className="absolute inset-0 block">
                          <img
                            src={frontImg}
                            alt={p.name}
                            className="w-full h-full object-cover object-center"
                            loading="lazy"
                            decoding="async"
                          />
                        </Link>
                        {p.bestseller && (
                          <span className="absolute top-2 left-2 z-10 text-[9px] font-bold tracking-wide bg-[var(--sk-espresso)] text-white px-2 py-0.5 rounded-full pointer-events-none">
                            Bestseller
                          </span>
                        )}
                        {p.premium && !p.bestseller && (
                          <span className="absolute top-2 left-2 z-10 text-[9px] font-bold tracking-wide bg-[var(--sk-gold-600)] text-white px-2 py-0.5 rounded-full pointer-events-none">
                            Premium
                          </span>
                        )}
                        <button
                          type="button"
                          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(p.id); }}
                          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/95 grid place-items-center shadow-sm text-[var(--sk-espresso)]"
                        >
                          <Heart size={13} strokeWidth={1.75} fill={wished ? 'currentColor' : 'none'} className={wished ? 'text-red-500' : ''} />
                        </button>
                      </div>
                      <div className="p-2.5 flex flex-col flex-1">
                        <Link to={href} className="font-display font-semibold text-[var(--sk-espresso)] text-[13px] leading-snug line-clamp-2 hover:underline">
                          {p.name}
                        </Link>
                        <div className="text-[12px] text-[#6B635A] mt-1 tabular-nums">
                          {inr(p.price)} <span className="text-[var(--sk-ink-400)]">/ {p.weight}</span>
                        </div>

                        <div className="mt-auto pt-2.5 flex items-center gap-1.5 relative z-10">
                          <div
                            className="inline-flex items-center border border-[#E8E4DF] rounded-full bg-white shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              aria-label="Decrease"
                              disabled={qty === 0}
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQty(p.id, qty - 1); }}
                              className="p-1.5 pl-2 disabled:opacity-30"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="text-[12px] w-4 text-center font-bold text-[var(--sk-espresso)]">{qty}</span>
                            <button
                              type="button"
                              aria-label="Increase"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); addOne(p); }}
                              className="p-1.5 pr-2"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!added) addOne(p); }}
                            className={`flex-1 min-w-0 text-[12px] font-semibold py-1.5 rounded-full inline-flex items-center justify-center gap-1 bg-[var(--sk-espresso)] text-white ${
                              added ? 'opacity-90 cursor-default' : 'hover:bg-[#2a1e16]'
                            }`}
                          >
                            {added ? <>Added <Check size={12} strokeWidth={3} /></> : 'Add'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!productsLoading && filteredProducts.length === 0 && (
                <div className="text-center py-12 text-[var(--sk-ink-500)]">No products in this category yet.</div>
              )}

              {overBudget && (
                <div className="mt-5 text-sm text-[var(--sk-red-500)] font-medium bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  You’re over budget by {inr(Math.abs(remaining))}. Remove items or{' '}
                  <button type="button" className="underline font-semibold" onClick={() => goto(0)}>increase your budget</button> to continue.
                </div>
              )}

              <div className="mt-8 flex gap-3 lg:hidden">
                <button type="button" onClick={() => goto(1)} className="sk-btn-outline flex-1 !py-2.5 !rounded-full">
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  type="button"
                  disabled={overBudget || chosen.length === 0}
                  onClick={() => goto(3)}
                  className="sk-btn-hamper flex-1 !py-2.5"
                >
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ——— STEP 4: GIFT CARD ——— */}
          {step === 'gift-card' && (
            <div>
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
                      <p className="text-[var(--sk-ink-600)] text-sm">Creating a photo of your packed hamper…</p>
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
                    <p className="text-sm text-[var(--sk-ink-600)] mt-1">
                      {chosen.length
                        ? `AI preview of your ${styleObj.type || styleObj.name} packed with ${chosen.map(hamperProductLabel).join(', ')}.`
                        : 'Add at least one product before generating an AI preview.'}
                    </p>
                    {previewNote && <p className="text-sm text-ink-500 mt-2">{previewNote}</p>}
                    <button
                      type="button"
                      disabled={chosen.length === 0 || !previewReady}
                      onClick={generateHamperImage}
                      className="mt-3 sk-btn-outline !py-2 !px-4 text-sm rounded-full inline-flex items-center gap-1.5 disabled:opacity-40"
                    >
                      <Sparkles size={14} /> Generate AI Preview
                    </button>

                    <div className="mt-5 grid md:grid-cols-[1.1fr_1fr] gap-6">
                      <div>
                        <div className="aspect-square rounded-2xl overflow-hidden bg-[var(--sk-cream-200)]">
                          {previewSlides[previewThumb] ? (
                            <img
                              src={previewSlides[previewThumb].url}
                              alt={previewSlides[previewThumb].label || styleObj.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-sm text-[var(--sk-ink-500)] p-6 text-center">
                              Choose a hamper and products, then generate the AI preview.
                            </div>
                          )}
                        </div>
                        {previewSlides[previewThumb]?.label && (
                          <div className="mt-2 text-center text-xs font-semibold uppercase tracking-wide text-[var(--sk-brown-700)]">
                            {previewSlides[previewThumb].label}
                          </div>
                        )}
                        {previewSlides.length > 1 && (
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="Previous image"
                            onClick={() => setPreviewThumb((t) => (t + previewSlides.length - 1) % previewSlides.length)}
                            className="w-8 h-8 rounded-full border border-[var(--sk-line-strong)] grid place-items-center text-[var(--sk-brown-900)]"
                          >
                            <ArrowLeft size={14} />
                          </button>
                          {previewSlides.map((slide, i) => (
                            <button
                              key={slide.key || slide.url}
                              type="button"
                              onClick={() => setPreviewThumb(i)}
                              className={`w-14 h-14 rounded-lg overflow-hidden border-2 ${
                                previewThumb === i ? 'border-[var(--sk-brown-900)]' : 'border-transparent'
                              }`}
                              title={slide.label}
                            >
                              <img src={slide.url} alt={slide.label || ''} className="w-full h-full object-cover" />
                            </button>
                          ))}
                          <button
                            type="button"
                            aria-label="Next image"
                            onClick={() => setPreviewThumb((t) => (t + 1) % previewSlides.length)}
                            className="w-8 h-8 rounded-full border border-[var(--sk-line-strong)] grid place-items-center text-[var(--sk-brown-900)]"
                          >
                            <ArrowRight size={14} />
                          </button>
                        </div>
                        )}
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
      <WizardTrustStrip />
    </div>
  );
}
