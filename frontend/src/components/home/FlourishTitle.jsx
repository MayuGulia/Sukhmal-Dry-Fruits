import React from 'react';

/** Centered section title with gold decorative flourishes — homepage brand chrome. */
export default function FlourishTitle({ title, cta, className = '' }) {
  return (
    <div className={`relative mb-8 md:mb-11 ${className}`}>
      <div className="flex flex-col items-center text-center px-8 md:px-24">
        <div className="flex items-center justify-center gap-3 md:gap-5">
          <GoldFlourish />
          <h2 className="sk-section-title text-[1.65rem] md:text-[2rem] lg:text-[2.15rem] leading-tight tracking-[-0.02em]">
            {title}
          </h2>
          <GoldFlourish mirror />
        </div>
      </div>
      {cta && (
        <div className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2">
          {cta}
        </div>
      )}
      {cta && (
        <div className="md:hidden flex justify-center mt-3">{cta}</div>
      )}
    </div>
  );
}

function GoldFlourish({ mirror = false }) {
  return (
    <svg
      aria-hidden
      className={`text-[var(--sk-gold-500)] shrink-0 opacity-90 ${mirror ? 'scale-x-[-1]' : ''}`}
      width="40"
      height="14"
      viewBox="0 0 40 14"
      fill="none"
    >
      <path
        d="M1 7c5.5-6.5 11-6.5 18 0 7 6.5 12.5 6.5 20 0"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
      <circle cx="20" cy="7" r="2" fill="currentColor" />
      <circle cx="8" cy="7" r="1" fill="currentColor" opacity="0.55" />
      <circle cx="32" cy="7" r="1" fill="currentColor" opacity="0.55" />
    </svg>
  );
}
