import React, { useId } from 'react';
import { Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';

/** Gold medallion seal — tree-of-life mark on a metallic disc. */
export default function BrandSeal({ size = 68, className = '' }) {
  const raw = useId();
  const uid = `sk-seal-${raw.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden
      className={`shrink-0 drop-shadow-[0_2px_8px_rgba(31,22,16,0.18)] ${className}`}
    >
      <defs>
        <linearGradient id={`${uid}-gold`} x1="18" y1="4" x2="62" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F0D78A" />
          <stop offset="42%" stopColor="#C59B27" />
          <stop offset="100%" stopColor="#8F6E14" />
        </linearGradient>
        <linearGradient id={`${uid}-gold-soft`} x1="40" y1="12" x2="40" y2="68" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F6E7B4" />
          <stop offset="100%" stopColor="#C59B27" />
        </linearGradient>
      </defs>

      <circle cx="40" cy="40" r="39" fill={`url(#${uid}-gold)`} />
      <circle cx="40" cy="40" r="36.2" fill="none" stroke="#1F1610" strokeWidth="1.15" opacity="0.28" />
      <circle cx="40" cy="40" r="32.4" fill="none" stroke="#1F1610" strokeWidth="0.7" opacity="0.22" />
      <circle cx="40" cy="40" r="29.6" fill={`url(#${uid}-gold-soft)`} opacity="0.35" />
      <circle cx="40" cy="40" r="29.6" fill="none" stroke="#1F1610" strokeWidth="0.55" opacity="0.18" />

      {/* Almond tree of life */}
      <g stroke="#1F1610" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M40 58.5c0-6.5.15-13.5.15-18.8" strokeWidth="2.15" />
        <path d="M40.15 48.2c-7.2-3.6-11.4-9.2-13.2-15.4" strokeWidth="1.45" />
        <path d="M40.15 48.2c7.2-3.6 11.4-9.2 13.2-15.4" strokeWidth="1.45" />
        <path d="M40.15 42.4c-8.4-1.8-12.6-8.4-12.2-15.2" strokeWidth="1.3" />
        <path d="M40.15 42.4c8.4-1.8 12.6-8.4 12.2-15.2" strokeWidth="1.3" />
        <path d="M33.4 38.2c-4.8-4.4-6.2-9.6-4.6-14.2" strokeWidth="1.2" />
        <path d="M46.9 38.2c4.8-4.4 6.2-9.6 4.6-14.2" strokeWidth="1.2" />
        <path d="M40.15 36.5c-3.4-6.8-1.6-11.8 2.4-14.6" strokeWidth="1.15" />
        <path d="M40.15 36.5c3.4-6.8 1.6-11.8-2.4-14.6" strokeWidth="1.15" />
      </g>
      <g fill="#1F1610">
        <circle cx="27.2" cy="30.4" r="1.35" />
        <circle cx="52.8" cy="30.4" r="1.35" />
        <circle cx="32.6" cy="24.2" r="1.2" />
        <circle cx="47.4" cy="24.2" r="1.2" />
        <circle cx="40.15" cy="21.2" r="1.35" />
        <circle cx="36.2" cy="29.6" r="1.05" />
        <circle cx="44.1" cy="29.6" r="1.05" />
        <circle cx="29.8" cy="36.8" r="1.05" />
        <circle cx="50.2" cy="36.8" r="1.05" />
      </g>
    </svg>
  );
}

export function BrandLockup({
  to = '/',
  sealSize = 68,
  compact = false,
  inverted = false,
  showTagline = true,
  className = '',
}) {
  const nameCls = inverted ? 'text-[#F0D78A]' : 'text-brand-900';
  const subCls = inverted ? 'text-cream-200/85' : 'text-brand-700';
  const tagCls = inverted ? 'text-cream-200/60' : 'text-ink-500';

  const inner = (
    <>
      <BrandSeal size={sealSize} />
      <span className={`flex flex-col ${compact ? 'leading-[1.05]' : 'leading-[1.08]'}`}>
        <span
          className={`font-display font-bold tracking-[0.12em] ${nameCls} ${
            compact ? 'text-[15px]' : 'text-[1.45rem] xl:text-[1.6rem]'
          }`}
        >
          SUKHMAL
        </span>
        <span
          className={`font-display italic font-medium ${subCls} ${
            compact ? 'text-[10px]' : 'text-[13px] xl:text-[14px]'
          }`}
        >
          Dry Fruits Korner
        </span>
        {showTagline && (
          <span
            className={`inline-flex items-center gap-1 font-ui ${tagCls} ${
              compact ? 'text-[8px] mt-0.5' : 'text-[10px] xl:text-[11px] mt-0.5'
            }`}
          >
            Healthy Life, Naturally
            <Leaf size={compact ? 9 : 11} className="text-[var(--sk-green-500)]" strokeWidth={2.25} />
          </span>
        )}
      </span>
    </>
  );

  const shared = `inline-flex items-center ${compact ? 'gap-2' : 'gap-3'} shrink-0 ${className}`;

  if (to) {
    return (
      <Link to={to} className={shared} aria-label="Sukhmal Dry Fruits Korner — Home">
        {inner}
      </Link>
    );
  }

  return <span className={shared}>{inner}</span>;
}

export function GiftBasketIcon({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M4.5 10.5h15l-1.05 8.1A2.2 2.2 0 0 1 16.28 20.7H7.72a2.2 2.2 0 0 1-2.17-2.1L4.5 10.5Z" />
      <path d="M3.5 10.5h17" />
      <path d="M8 10.5V8.2a4 4 0 0 1 8 0v2.3" />
      <path d="M12 7.4c-1.6-2.2-3.6-2.6-4.6-1.6 1.4.2 2.4 1.2 2.4 2.5" />
      <path d="M12 7.4c1.6-2.2 3.6-2.6 4.6-1.6-1.4.2-2.4 1.2-2.4 2.5" />
      <path d="M12 10.5v10.2" />
    </svg>
  );
}
