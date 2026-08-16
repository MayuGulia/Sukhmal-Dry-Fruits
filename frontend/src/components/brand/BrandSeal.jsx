import React from 'react';
import { Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SUKHMAL_LOGO_SRC = '/brand/sukhmal-logo.png?v=tight-crop';

/** Official circular Sukhmal Dry Fruits Korner seal. */
export default function BrandSeal({ size = 68, className = '' }) {
  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden rounded-full bg-black ring-1 ring-[#C5A059]/55 shadow-[0_2px_10px_rgba(31,22,16,0.22)] ${className}`}
      style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden' }}
    >
      <img
        src={SUKHMAL_LOGO_SRC}
        alt=""
        width={size}
        height={size}
        draggable="false"
        className="block h-full w-full object-cover"
        style={{ width: '100%', height: '100%', objectFit: 'cover', margin: 0, padding: 0 }}
      />
    </span>
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
