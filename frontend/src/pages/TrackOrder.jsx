import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Breadcrumb from '@/components/shared/Breadcrumb';
import ProductCard from '@/components/shared/ProductCard';
import FlourishTitle from '@/components/home/FlourishTitle';
import { HERO_IMG } from '@/data/homeBrand';
import { useProducts, ProductSkeleton } from '@/lib/catalog';
import { inr } from '@/lib/utils';
import {
  MapPin,
  ArrowRight,
  Package,
  Check,
  Truck,
  Gift,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Copy,
  Phone,
  MessageCircle,
  CalendarDays,
  Clock,
  ShieldCheck,
  AlertCircle,
  Info,
} from 'lucide-react';

const STEPS = [
  { key: 'confirmed', label: 'Order Confirmed', short: 'Confirmed', Ic: Check },
  { key: 'packed', label: 'Packed', short: 'Packed', Ic: Check },
  { key: 'shipped', label: 'Shipped', short: 'Shipped', Ic: Truck },
  { key: 'ofd', label: 'Out For Delivery', short: 'Out For Delivery', Ic: Truck },
  { key: 'delivered', label: 'Delivered', short: 'Delivered', Ic: Gift },
];

const STATUS_COPY = {
  confirmed: 'Your order is confirmed — we’re preparing your hamper with care.',
  packed: 'Your hamper is carefully packed and ready for dispatch.',
  shipped: 'Your hamper is on the move with our delivery partner.',
  ofd: 'Your hamper is carefully packed and on its way with premium handling.',
  delivered: 'Your gift has been delivered. We hope it brings a smile!',
};

/** Dummy public tracking records keyed by Order ID (case-insensitive). */
const TRACK_DB = {
  SKF458792: {
    id: 'SKF458792',
    placedOn: '18 May, 2025',
    placedTime: '11:42 AM',
    recipient: 'Monika Batra',
    paymentStatus: 'Paid Successfully',
    amount: 2204,
    status: 'ofd',
    stepTimes: {
      confirmed: '18 May, 11:42 AM',
      packed: '18 May, 01:15 PM',
      shipped: '19 May, 09:30 AM',
      ofd: '24 May, 07:30 AM',
      delivered: null,
    },
    etaDate: '24 May, 2025',
    etaTime: 'Before 8:00 PM',
    onTime: true,
    partner: {
      name: 'Blue Dart Express',
      tracking: 'BDS4792394',
      support: '+91 1860 233 1234',
      hours: 'Mon – Sat | 9 AM – 7 PM',
    },
    timeline: [
      {
        title: 'Out For Delivery',
        at: '24 May, 07:30 AM',
        text: 'Your order is out for delivery and will reach you soon.',
        current: true,
      },
      {
        title: 'Reached Local Delivery Hub',
        at: '24 May, 05:15 AM',
        text: 'Your order has reached the local delivery hub.',
      },
      {
        title: 'Handed to Delivery Partner',
        at: '23 May, 08:40 PM',
        text: 'Your order has been picked up by our delivery partner.',
      },
      {
        title: 'Shipped',
        at: '19 May, 09:30 AM',
        text: 'Your order is on its way to you.',
      },
      {
        title: 'Package Packed',
        at: '18 May, 01:15 PM',
        text: 'We have packed your order with care.',
      },
      {
        title: 'Order Confirmed',
        at: '18 May, 11:42 AM',
        text: 'Payment received — order confirmed.',
      },
    ],
  },
  SKF120045: {
    id: 'SKF120045',
    placedOn: '10 May, 2025',
    placedTime: '04:20 PM',
    recipient: 'Rahul Mehta',
    paymentStatus: 'Paid Successfully',
    amount: 1499,
    status: 'shipped',
    stepTimes: {
      confirmed: '10 May, 04:20 PM',
      packed: '11 May, 10:05 AM',
      shipped: '11 May, 06:40 PM',
      ofd: null,
      delivered: null,
    },
    etaDate: '15 May, 2025',
    etaTime: 'Before 9:00 PM',
    onTime: true,
    partner: {
      name: 'Blue Dart Express',
      tracking: 'BDX8812045',
      support: '+91 1860 233 1234',
      hours: 'Mon – Sat | 9 AM – 7 PM',
    },
    timeline: [
      {
        title: 'Shipped',
        at: '11 May, 06:40 PM',
        text: 'Your order is on its way to you.',
        current: true,
      },
      {
        title: 'Package Packed',
        at: '11 May, 10:05 AM',
        text: 'We have packed your order with care.',
      },
      {
        title: 'Order Confirmed',
        at: '10 May, 04:20 PM',
        text: 'Payment received — order confirmed.',
      },
    ],
  },
  SKF998877: {
    id: 'SKF998877',
    placedOn: '02 May, 2025',
    placedTime: '12:05 PM',
    recipient: 'Priya Sharma',
    paymentStatus: 'Paid Successfully',
    amount: 3299,
    status: 'delivered',
    stepTimes: {
      confirmed: '02 May, 12:05 PM',
      packed: '02 May, 04:30 PM',
      shipped: '03 May, 08:00 AM',
      ofd: '05 May, 08:15 AM',
      delivered: '05 May, 02:40 PM',
    },
    etaDate: '05 May, 2025',
    etaTime: 'Delivered at 2:40 PM',
    onTime: true,
    partner: {
      name: 'Blue Dart Express',
      tracking: 'BDX9988771',
      support: '+91 1860 233 1234',
      hours: 'Mon – Sat | 9 AM – 7 PM',
    },
    timeline: [
      {
        title: 'Delivered',
        at: '05 May, 02:40 PM',
        text: 'Gift delivered successfully to the recipient.',
        current: true,
      },
      {
        title: 'Out For Delivery',
        at: '05 May, 08:15 AM',
        text: 'Your order is out for delivery and will reach you soon.',
      },
      {
        title: 'Shipped',
        at: '03 May, 08:00 AM',
        text: 'Your order is on its way to you.',
      },
      {
        title: 'Package Packed',
        at: '02 May, 04:30 PM',
        text: 'We have packed your order with care.',
      },
      {
        title: 'Order Confirmed',
        at: '02 May, 12:05 PM',
        text: 'Payment received — order confirmed.',
      },
    ],
  },
};

function LeafDecor({ className = '', flip = false }) {
  return (
    <svg
      aria-hidden
      className={`${className} ${flip ? 'scale-x-[-1]' : ''}`}
      viewBox="0 0 120 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M62 8c-6 28-28 48-42 62 22 4 40 22 48 48 10-28 34-46 48-54-22-2-42-24-54-56z"
        fill="currentColor"
        opacity="0.35"
      />
      <path
        d="M58 48c-4 18-18 32-28 42 14 2 26 14 32 32 6-18 22-30 32-36-14-2-28-16-36-38z"
        fill="currentColor"
        opacity="0.22"
      />
      <path d="M60 20c2 40 4 70 2 120" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
    </svg>
  );
}

function DiamondRule() {
  return (
    <div className="flex items-center gap-3 my-3" aria-hidden>
      <span className="h-px flex-1 bg-[var(--sk-line-strong)]" />
      <svg width="14" height="14" viewBox="0 0 14 14" className="text-[var(--sk-gold-400)] shrink-0">
        <path d="M7 1.5 12.5 7 7 12.5 1.5 7 7 1.5Z" fill="currentColor" opacity="0.85" />
      </svg>
      <span className="h-px flex-1 bg-[var(--sk-line-strong)]" />
    </div>
  );
}

function BlueDartMark() {
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#1B4F9C]/20 bg-[#F0F5FC]"
      aria-hidden
    >
      <span className="font-bold text-[11px] tracking-wide text-[#1B4F9C]">BLUE</span>
      <span className="font-bold text-[11px] tracking-wide text-[#2E8B57]">DART</span>
    </div>
  );
}

function lookupOrder(raw) {
  const key = String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
  if (!key) return { error: 'Please enter your Order ID.' };
  const hit = TRACK_DB[key] || Object.values(TRACK_DB).find((o) => o.id.toUpperCase() === key);
  if (!hit) {
    return {
      error:
        'We couldn’t find an order with that ID. Double-check the ID from your confirmation email, or try SKF458792.',
    };
  }
  return { data: hit };
}

function Stepper({ result, compact = false }) {
  const statusIdx = STEPS.findIndex((s) => s.key === result.status);

  return (
    <div className={`w-full ${compact ? 'overflow-x-auto pb-1 -mx-1 px-1' : ''}`}>
      <div className={`flex items-start ${compact ? 'min-w-[540px] gap-0' : 'justify-between gap-1'}`}>
        {STEPS.map((s, i) => {
          const done = i < statusIdx;
          const active = i === statusIdx;
          const pending = i > statusIdx;
          const Ic = s.Ic;
          const time = result.stepTimes?.[s.key];

          return (
            <React.Fragment key={s.key}>
              <div className={`flex flex-col items-center text-center ${compact ? 'w-[108px]' : 'flex-1 min-w-0'}`}>
                <div
                  className={[
                    'rounded-full grid place-items-center border-2 transition-all',
                    active
                      ? 'w-12 h-12 md:w-14 md:h-14 border-brand-900 bg-brand-900 text-white shadow-sk-md scale-105'
                      : '',
                    done && !active
                      ? 'w-10 h-10 md:w-11 md:h-11 border-[var(--sk-green-500)] bg-[var(--sk-green-500)] text-white'
                      : '',
                    pending
                      ? 'w-10 h-10 md:w-11 md:h-11 border-[var(--sk-line-strong)] bg-cream-200 text-ink-400'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {done && !active ? <Check size={18} strokeWidth={2.5} /> : <Ic size={active ? 22 : 18} />}
                </div>
                <div
                  className={`mt-2.5 text-[11px] md:text-[12px] font-semibold leading-tight ${
                    pending ? 'text-ink-400' : 'text-brand-900'
                  }`}
                >
                  {compact ? s.short : s.label}
                </div>
                <div className="mt-0.5 text-[10px] md:text-[11px] text-ink-500 leading-snug px-0.5">
                  {time || (pending ? 'Pending' : '')}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mt-5 md:mt-6 h-[3px] rounded-full flex-1 min-w-[12px] ${
                    i < statusIdx ? 'bg-[var(--sk-green-500)]' : 'bg-[var(--sk-line-strong)]'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function Timeline({ items, expanded, onToggle, columns = false }) {
  const visible = expanded ? items : items.slice(0, 3);
  return (
    <div>
      <ol
        className={
          columns && expanded && items.length > 3
            ? 'grid md:grid-cols-2 gap-x-8 gap-y-5'
            : 'relative space-y-5'
        }
      >
        {visible.map((t, i) => (
          <li key={`${t.title}-${i}`} className="relative flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${
                  t.current ? 'bg-brand-900 ring-4 ring-brand-900/10' : 'bg-[var(--sk-green-500)]'
                }`}
              />
              {!(columns && expanded) && i < visible.length - 1 && (
                <span className="w-px flex-1 bg-[var(--sk-line-strong)] mt-1 min-h-[28px]" />
              )}
            </div>
            <div className="pb-1 min-w-0">
              <div className="text-[11px] text-ink-500">{t.at}</div>
              <div className="font-semibold text-brand-900 text-sm mt-0.5">{t.title}</div>
              <div className="text-[13px] text-ink-600 mt-0.5 leading-snug">{t.text}</div>
            </div>
          </li>
        ))}
      </ol>
      {items.length > 3 && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-900 border border-line-strong rounded-lg px-3.5 py-1.5 hover:bg-cream-200"
          >
            {expanded ? (
              <>
                Show Less <ChevronUp size={14} />
              </>
            ) : (
              <>
                Show More <ChevronDown size={14} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function PartnerBody({ partner }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(partner.tracking);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-ink-500">Partner Name</div>
          <div className="font-semibold text-brand-900 mt-0.5">{partner.name}</div>
        </div>
        <BlueDartMark />
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-wide text-ink-500">Tracking Number</div>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="font-mono font-semibold text-brand-900 tracking-wide">{partner.tracking}</span>
          <button
            type="button"
            onClick={copy}
            className="text-ink-500 hover:text-brand-900"
            aria-label="Copy tracking number"
          >
            <Copy size={14} />
          </button>
          {copied && <span className="text-[11px] text-[var(--sk-green-500)]">Copied</span>}
        </div>
      </div>
      <div className="pt-3 border-t border-line flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-ink-500 inline-flex items-center gap-1">
            <Info size={12} /> Customer Support
          </div>
          <div className="text-sm font-semibold text-brand-900 mt-0.5">{partner.support}</div>
          <div className="text-[12px] text-ink-600 mt-0.5 flex items-center gap-1.5">
            <Clock size={12} /> {partner.hours}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`tel:${partner.support.replace(/\s/g, '')}`}
            className="h-8 w-8 rounded-full border border-line-strong grid place-items-center text-brand-900 hover:bg-cream-200"
            aria-label="Call support"
          >
            <Phone size={14} />
          </a>
          <a
            href="https://wa.me/918600000000"
            target="_blank"
            rel="noreferrer"
            className="h-8 w-8 rounded-full border border-line-strong grid place-items-center text-brand-900 hover:bg-cream-200"
            aria-label="Message support"
          >
            <MessageCircle size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}

function EtaBody({ result, centered = false }) {
  return (
    <div
      className={
        centered
          ? 'flex flex-col items-center text-center gap-3'
          : 'flex flex-wrap items-end justify-between gap-4'
      }
    >
      <div>
        <div
          className={`text-[11px] uppercase tracking-wide font-semibold ${
            centered ? 'text-ink-500' : 'text-[var(--sk-gold-400)]'
          }`}
        >
          Expected Delivery
        </div>
        <div className="font-display font-bold text-brand-900 text-2xl md:text-[1.65rem] leading-tight mt-1">
          {result.etaDate}
        </div>
        <div className="text-sm text-brand-900 mt-0.5">{result.etaTime}</div>
      </div>
      {result.onTime && (
        <span className="sk-pill sk-pill-green !rounded-md gap-1.5">
          <Truck size={13} /> On Time Delivery
        </span>
      )}
    </div>
  );
}

function AccordionItem({ id, open, onToggle, icon: Ic, title, children }) {
  const isOpen = open === id;
  return (
    <div className="sk-card overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
        aria-expanded={isOpen}
      >
        <span className="inline-flex items-center gap-2.5 font-display font-bold text-brand-900 text-[15px]">
          <Ic size={18} className="text-brand-900 shrink-0" />
          {title}
        </span>
        <ChevronDown
          size={18}
          className={`text-ink-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && <div className="px-4 pb-4 border-t border-line pt-3">{children}</div>}
    </div>
  );
}

export default function TrackOrder() {
  const [sp] = useSearchParams();
  const initial = sp.get('id') || sp.get('orderId') || '';
  const [id, setId] = useState(initial);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [acc, setAcc] = useState('eta');
  const { data: PRODUCTS, loading } = useProducts({ bestseller: true, limit: 8 });

  const runLookup = (value) => {
    const { data, error: err } = lookupOrder(value);
    setError(err || '');
    setResult(data || null);
    setTimelineOpen(true);
    if (data) setAcc('eta');
  };

  useEffect(() => {
    if (initial) runLookup(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (e) => {
    e.preventDefault();
    runLookup(id);
  };

  const statusLabel = useMemo(() => {
    if (!result) return '';
    return STEPS.find((s) => s.key === result.status)?.label || '';
  }, [result]);

  const toggleAcc = (next) => setAcc((cur) => (cur === next ? '' : next));

  return (
    <div className="bg-[var(--sk-cream-100)] pb-16 md:pb-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-cream-300/70 border-b border-line">
        <div className="sk-container pt-5 md:pt-6 relative z-[1]">
          <Breadcrumb
            items={[
              { label: 'My Orders', to: '/account/orders' },
              { label: 'Track Order' },
            ]}
          />
        </div>

        <div className="sk-container relative pt-6 md:pt-10 pb-24 md:pb-28">
          <LeafDecor className="pointer-events-none absolute left-0 md:left-2 top-8 w-16 md:w-24 text-[var(--sk-green-500)] opacity-70 hidden sm:block" />
          <LeafDecor
            flip
            className="pointer-events-none absolute right-[38%] top-4 w-14 text-[var(--sk-green-500)] opacity-50 hidden lg:block"
          />

          <div className="grid md:grid-cols-[1fr_minmax(220px,340px)] gap-6 md:gap-10 items-center relative z-[1]">
            <div className="max-w-xl">
              <h1 className="font-display font-bold text-brand-900 text-[1.85rem] sm:text-4xl md:text-[2.75rem] leading-[1.15]">
                Track Your Gift Journey
              </h1>
              <p className="mt-3 text-ink-600 text-sm md:text-base max-w-md leading-relaxed">
                Stay updated with every step of your order, from packing to doorstep delivery.
              </p>
            </div>
            <div className="relative justify-self-end w-full max-w-[280px] sm:max-w-[300px] md:max-w-none ml-auto">
              <LeafDecor
                flip
                className="pointer-events-none absolute -right-2 -top-4 w-14 md:w-20 text-[var(--sk-green-500)] opacity-60"
              />
              <div className="relative rounded-2xl overflow-hidden aspect-[5/4] md:aspect-[4/3] shadow-sk-md bg-cream-200">
                <img
                  src={HERO_IMG}
                  alt="Premium dry fruits gift box"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Lookup card — overlaps hero */}
          <form
            onSubmit={submit}
            className="absolute left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 bottom-0 translate-y-1/2 w-auto md:w-[min(720px,92%)] z-10"
          >
            <div className="bg-white rounded-2xl border border-line shadow-sk-lg p-4 md:p-5">
              <div className="flex items-start gap-3 mb-3.5">
                <div className="h-10 w-10 rounded-full border border-line-strong grid place-items-center text-brand-900 shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <div className="font-display font-bold text-brand-900 text-lg md:text-xl leading-tight">
                    Enter Your Order ID
                  </div>
                  <div className="text-[12px] md:text-[13px] text-ink-500 mt-0.5">
                    Enter the 8-digit Order ID to track your order
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  data-testid="track-input"
                  placeholder="e.g. SKF458792"
                  className="sk-input font-mono tracking-wide"
                  aria-label="Order ID"
                />
                <button type="submit" className="sk-btn-primary whitespace-nowrap !px-5" data-testid="track-submit">
                  Track Order <ArrowRight size={16} />
                </button>
              </div>
              <p className="mt-2.5 text-[12px] text-ink-500">
                You can find your Order ID in the order confirmation email.
              </p>
              {error && (
                <div
                  role="alert"
                  className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-[var(--sk-red-500)]"
                  data-testid="track-error"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* Results */}
      <div className="sk-container pt-20 md:pt-24 space-y-5 md:space-y-6">
        {!result && !error && (
          <p className="text-center text-sm text-ink-500 max-w-lg mx-auto">
            Try a sample ID:{' '}
            {Object.keys(TRACK_DB).map((sample, i) => (
              <React.Fragment key={sample}>
                {i > 0 && <span className="text-ink-400"> · </span>}
                <button
                  type="button"
                  className="font-mono font-semibold text-brand-900 underline-offset-2 hover:underline"
                  onClick={() => {
                    setId(sample);
                    runLookup(sample);
                  }}
                >
                  {sample}
                </button>
              </React.Fragment>
            ))}
          </p>
        )}

        {result && (
          <>
            {/* Order Information */}
            <section className="sk-card p-4 md:p-5" data-testid="track-order-info">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="inline-flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-cream-300 grid place-items-center text-brand-900">
                    <Package size={15} />
                  </span>
                  <h2 className="font-display font-bold text-brand-900 text-lg md:text-xl">Order Information</h2>
                </div>
                <Link
                  to={`/account/orders/${result.id}`}
                  className="hidden md:inline-flex items-center gap-1 text-sm font-semibold text-brand-900 border border-line-strong rounded-lg px-3 py-1.5 hover:bg-cream-200"
                >
                  View Order Details <ChevronRight size={14} />
                </Link>
                <Link
                  to={`/account/orders/${result.id}`}
                  className="md:hidden text-sm font-semibold text-[var(--sk-gold-400)] inline-flex items-center gap-0.5"
                >
                  View Details <ChevronRight size={14} />
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-0 md:divide-x md:divide-[var(--sk-line)]">
                {[
                  { l: 'Order ID', v: result.id, mono: true },
                  {
                    l: 'Placed On',
                    v: result.placedOn,
                    sub: result.placedTime,
                    joined: `${result.placedOn} | ${result.placedTime}`,
                  },
                  { l: 'Recipient', v: result.recipient },
                  { l: 'Payment Status', v: result.paymentStatus, green: true },
                  { l: 'Total Amount', v: inr(result.amount), bold: true },
                ].map((cell) => (
                  <div key={cell.l} className="md:px-4 first:md:pl-0 last:md:pr-0">
                    <div className="text-[11px] uppercase tracking-wide text-ink-500">{cell.l}</div>
                    <div
                      className={`mt-1 text-sm md:text-[15px] ${
                        cell.green
                          ? 'font-semibold text-[var(--sk-green-500)]'
                          : cell.mono
                            ? 'font-mono font-bold text-brand-900'
                            : 'font-semibold text-brand-900'
                      }`}
                    >
                      <span className="md:hidden">{cell.joined || cell.v}</span>
                      <span className="hidden md:inline">{cell.v}</span>
                    </div>
                    {cell.sub && <div className="hidden md:block text-[12px] text-ink-500 mt-0.5">{cell.sub}</div>}
                  </div>
                ))}
              </div>
            </section>

            {/* Shipment Progress */}
            <section className="sk-card p-4 md:p-6" data-testid="track-stepper">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display font-bold text-brand-900 text-lg md:text-xl">Shipment Progress</h2>
                <div className="text-sm text-ink-600">
                  Current Status:{' '}
                  <span className="font-semibold text-[var(--sk-gold-400)] md:text-brand-900">{statusLabel}</span>
                </div>
              </div>
              <DiamondRule />
              <div className="mt-4 md:mt-5">
                <div className="hidden md:block">
                  <Stepper result={result} />
                </div>
                <div className="md:hidden">
                  <Stepper result={result} compact />
                </div>
              </div>
              <div className="mt-5 md:mt-6 flex items-center gap-2.5 rounded-xl bg-[#FEF0E6] px-3.5 py-3 text-[13px] md:text-sm text-brand-900">
                <ShieldCheck size={16} className="shrink-0 text-brand-900" />
                <span>{STATUS_COPY[result.status] || STATUS_COPY.ofd}</span>
              </div>
            </section>

            {/* Desktop: timeline + partner / ETA */}
            <div className="hidden md:grid md:grid-cols-[1.15fr_0.85fr] gap-5">
              <section className="sk-card p-5">
                <h3 className="font-display font-bold text-brand-900 text-lg mb-4 inline-flex items-center gap-2">
                  <Truck size={18} /> Tracking Updates
                </h3>
                <Timeline
                  items={result.timeline}
                  expanded={timelineOpen}
                  onToggle={() => setTimelineOpen((v) => !v)}
                  columns
                />
              </section>

              <div className="space-y-4">
                <section className="sk-card p-5">
                  <h3 className="font-display font-bold text-brand-900 text-lg mb-4 inline-flex items-center gap-2">
                    <Truck size={18} /> Delivery Partner
                  </h3>
                  <PartnerBody partner={result.partner} />
                </section>
                <section className="sk-card p-5">
                  <h3 className="font-display font-bold text-brand-900 text-lg mb-4 inline-flex items-center gap-2">
                    <CalendarDays size={18} /> Estimated Delivery
                  </h3>
                  <EtaBody result={result} />
                </section>
              </div>
            </div>

            {/* Mobile accordions */}
            <div className="md:hidden space-y-3">
              <AccordionItem id="timeline" open={acc} onToggle={toggleAcc} icon={Truck} title="Tracking Updates">
                <Timeline
                  items={result.timeline}
                  expanded={timelineOpen}
                  onToggle={() => setTimelineOpen((v) => !v)}
                />
              </AccordionItem>
              <AccordionItem id="partner" open={acc} onToggle={toggleAcc} icon={Truck} title="Delivery Partner">
                <PartnerBody partner={result.partner} />
              </AccordionItem>
              <AccordionItem id="eta" open={acc} onToggle={toggleAcc} icon={CalendarDays} title="Estimated Delivery">
                <EtaBody result={result} centered />
              </AccordionItem>
            </div>
          </>
        )}

        {/* Cross-sell */}
        <section className="pt-6 md:pt-10">
          <FlourishTitle title="You May Also Love" className="!mb-2" />
          <p className="text-center text-ink-500 text-sm mb-8 md:mb-10 -mt-1">Handpicked for you</p>
          <div className="sk-scroll-x md:grid md:grid-cols-4 lg:grid-cols-5 md:gap-4 md:overflow-visible">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <ProductSkeleton key={i} />)
              : PRODUCTS.slice(0, 5).map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
