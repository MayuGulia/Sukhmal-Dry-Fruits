import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, MapPin, Package, Leaf, Award, Hand } from 'lucide-react';

const TICKER = [
  { Icon: null, label: 'Razorpay UPI coming soon · COD works', gold: true },
  { Icon: Truck, label: 'Free Delivery on Orders Above ₹999' },
  { Icon: Leaf, label: '100% Natural' },
  { Icon: Award, label: 'Premium Quality' },
  { Icon: Hand, label: 'Handpicked with Care' },
];

function TickerItem({ Icon, label, gold, testId }) {
  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap px-5 ${
        gold ? 'text-gold-300 font-semibold tracking-[0.12em] uppercase text-[10px]' : ''
      }`}
    >
      {gold
        ? <span className="h-1 w-1 rotate-45 bg-gold-400 shrink-0" aria-hidden />
        : Icon ? <Icon size={13} strokeWidth={1.75} className="text-gold-400 shrink-0" /> : null}
      {label}
    </span>
  );
}

function TickerTrack() {
  const loop = [...TICKER, ...TICKER];
  return (
    <>
      <p className="sr-only">
        Razorpay UPI coming soon, COD works. Free delivery on orders above ₹999. 100% natural, premium quality, handpicked with care.
      </p>
      <div className="sk-ticker" aria-hidden="true">
        {loop.map((item, i) => (
          <TickerItem key={`${item.label}-${i}`} {...item} />
        ))}
      </div>
    </>
  );
}

export default function TopUtilityBar() {
  return (
    <div className="bg-[var(--sk-espresso)] text-white text-[12px] leading-none">
      <div className="lg:hidden h-8 flex items-center overflow-hidden">
        <TickerTrack />
      </div>
      <div className="hidden lg:block">
        <div className="sk-container flex items-center gap-6 h-9">
          <div className="flex-1 min-w-0 overflow-hidden">
            <TickerTrack />
          </div>
          <div className="shrink-0 flex items-center gap-5">
            <Link
              data-testid="top-track"
              to="/track-order"
              className="inline-flex items-center gap-1.5 hover:text-white/80 transition-colors whitespace-nowrap"
            >
              <Package size={13} strokeWidth={1.75} className="text-gold-400" />
              Track Order
            </Link>
            <Link
              to="/store-locator"
              className="inline-flex items-center gap-1.5 hover:text-white/80 transition-colors whitespace-nowrap"
            >
              <MapPin size={13} strokeWidth={1.75} className="text-gold-400" />
              Store Locator
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
