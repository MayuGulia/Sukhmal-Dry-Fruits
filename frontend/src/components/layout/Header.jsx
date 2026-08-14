import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, Menu, Gift, Leaf, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

function BrandSeal({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden className="shrink-0">
      <circle cx="32" cy="32" r="31" fill="var(--sk-brown-900)" stroke="var(--sk-gold-400)" strokeWidth="2" />
      <circle cx="32" cy="32" r="26" stroke="var(--sk-gold-500)" strokeWidth="1.25" opacity="0.85" />
      <circle cx="32" cy="32" r="22.5" stroke="var(--sk-gold-300)" strokeWidth="0.75" opacity="0.55" />
      <path
        d="M38.5 20.5c-2.2-1.8-5.1-2.4-7.8-1.5-3.4 1.1-5.6 4.2-5.6 7.7 0 3.2 1.7 5.7 4.8 7.1l6.2 2.8c2.1.9 3.2 2.1 3.2 3.8 0 2.3-2 3.9-4.7 3.9-2.1 0-3.9-.8-5.2-2.3l-2.6 2.7c1.9 2.1 4.7 3.3 7.8 3.3 5.1 0 8.7-3.1 8.7-7.6 0-3.5-2-5.9-5.6-7.5l-5.5-2.5c-1.9-.9-2.9-2-2.9-3.5 0-2 1.7-3.4 4.1-3.4 1.7 0 3.2.6 4.3 1.8l2.8-2.8z"
        fill="var(--sk-gold-400)"
      />
    </svg>
  );
}

export default function Header({ onOpenDrawer }) {
  const { count } = useCart();
  const [q, setQ] = useState('');
  const [overlayQ, setOverlayQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const overlayInputRef = useRef(null);
  const nav = useNavigate();

  const submitDesktop = (e) => {
    e.preventDefault();
    if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const submitOverlay = (e) => {
    e.preventDefault();
    const term = overlayQ.trim();
    if (!term) return;
    setSearchOpen(false);
    setOverlayQ('');
    nav(`/search?q=${encodeURIComponent(term)}`);
  };

  const openSearch = () => {
    setOverlayQ('');
    setSearchOpen(true);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setOverlayQ('');
  };

  useEffect(() => {
    if (!searchOpen) return undefined;
    const t = requestAnimationFrame(() => overlayInputRef.current?.focus());
    const onKey = (e) => {
      if (e.key === 'Escape') closeSearch();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [searchOpen]);

  return (
    <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-md border-b border-line">
      {/* Mobile + tablet (&lt; lg / 1024): hamburger | compact logo | search + cart */}
      <div className="lg:hidden relative flex items-center h-14 px-3 sm:px-4">
        <button
          type="button"
          data-testid="mob-hamburger"
          onClick={onOpenDrawer}
          className="relative z-10 shrink-0 p-2 -ml-1 text-brand-900 rounded-lg hover:bg-cream-300/60 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} strokeWidth={1.75} />
        </button>

        <Link
          to="/"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2"
          aria-label="Sukhmal Dry Fruits Korner — Home"
        >
          <BrandSeal size={36} />
          <span className="hidden xs:block font-display text-brand-900 text-[15px] font-bold tracking-wide">
            SUKHMAL
          </span>
        </Link>

        <div className="ml-auto relative z-10 flex items-center gap-0.5">
          <button
            type="button"
            data-testid="mob-search"
            className="p-2 text-brand-900 rounded-lg hover:bg-cream-300/60 transition-colors"
            onClick={openSearch}
            aria-label="Search"
          >
            <Search size={22} strokeWidth={1.75} />
          </button>
          <Link
            to="/cart"
            data-testid="mob-hdr-cart"
            className="relative p-2 text-brand-900 rounded-lg hover:bg-cream-300/60 transition-colors"
            aria-label="Cart"
          >
            <ShoppingBag size={22} strokeWidth={1.75} />
            <span
              data-testid="mob-cart-badge"
              className="absolute top-0.5 right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[var(--sk-badge-red)] text-white text-[10px] font-bold grid place-items-center leading-none"
            >
              {count > 99 ? '99+' : count}
            </span>
          </Link>
        </div>
      </div>

      {/* Desktop (≥ lg / 1024) — P1 structure preserved */}
      <div className="hidden lg:flex sk-container items-center gap-3 h-[4.75rem]">
        <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="Sukhmal Dry Fruits Korner — Home">
          <BrandSeal size={52} />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-brand-900 text-[1.35rem] font-bold tracking-wide">SUKHMAL</span>
            <span className="text-[10px] tracking-[0.22em] text-brand-700 -mt-0.5 uppercase font-semibold">
              Dry Fruits Korner
            </span>
            <span className="text-[10px] italic text-ink-500 -mt-0.5 inline-flex items-center gap-1">
              Healthy Life, Naturally
              <Leaf size={10} className="text-[var(--sk-green-500)]" strokeWidth={2.25} />
            </span>
          </div>
        </Link>

        <form onSubmit={submitDesktop} className="flex flex-1 max-w-xl mx-4 relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            data-testid="hdr-search"
            placeholder="Search for dry fruits, nuts, gift hampers..."
            className="sk-input !rounded-full pr-12 pl-5 !border-[var(--sk-line-strong)] shadow-sk-sm"
          />
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-brand-900 text-gold-300 grid place-items-center hover:bg-brand-800 transition-colors"
          >
            <Search size={17} strokeWidth={2.25} />
          </button>
        </form>

        <div className="ml-auto flex items-center gap-3">
          <Link
            to="/wishlist"
            className="inline-flex items-center text-brand-900 hover:text-brand-700 transition-colors"
            aria-label="Wishlist"
          >
            <Heart size={22} strokeWidth={1.75} />
          </Link>
          <Link
            to="/build-hamper/budget"
            data-testid="hdr-build-hamper"
            className="inline-flex items-center gap-2 rounded-[10px] bg-brand-900 text-white text-sm font-semibold py-2.5 px-4 border border-gold-500/70 shadow-sk-sm hover:bg-brand-800 transition-colors"
          >
            <Gift size={16} className="text-gold-400" /> Build Your Own Hamper
          </Link>
          <Link to="/cart" data-testid="hdr-cart" className="relative text-brand-900" aria-label="Cart">
            <ShoppingBag size={24} strokeWidth={1.75} />
            <span
              data-testid="cart-badge"
              className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--sk-badge-red)] text-white text-[10px] font-bold grid place-items-center leading-none"
            >
              {count}
            </span>
          </Link>
        </div>
      </div>

      {/* Full-width search overlay — mobile + tablet */}
      <div
        className={`lg:hidden fixed inset-0 z-[60] transition-[opacity,visibility] duration-200 ${
          searchOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
      >
        <button
          type="button"
          className="absolute inset-0 bg-brand-900/45 backdrop-blur-[2px]"
          aria-label="Dismiss search"
          onClick={closeSearch}
        />
        <div
          className={`relative bg-cream-100 border-b border-line shadow-sk-lg transition-transform duration-300 ease-out ${
            searchOpen ? 'translate-y-0' : '-translate-y-3'
          }`}
        >
          <form onSubmit={submitOverlay} className="flex items-center gap-2 px-3 sm:px-4 h-14">
            <Search size={20} className="shrink-0 text-brand-700" strokeWidth={1.75} />
            <input
              ref={overlayInputRef}
              value={overlayQ}
              onChange={(e) => setOverlayQ(e.target.value)}
              data-testid="mob-search-input"
              placeholder="Search dry fruits, nuts, hampers..."
              className="flex-1 min-w-0 bg-transparent text-[15px] text-ink-800 placeholder:text-ink-400 outline-none"
              enterKeyHint="search"
              autoComplete="off"
            />
            <button
              type="submit"
              className="shrink-0 h-9 px-3.5 rounded-full bg-brand-900 text-white text-sm font-semibold"
            >
              Search
            </button>
            <button
              type="button"
              data-testid="mob-search-close"
              onClick={closeSearch}
              className="shrink-0 p-2 -mr-1 text-brand-900 rounded-lg hover:bg-cream-300/70"
              aria-label="Close search"
            >
              <X size={22} strokeWidth={1.75} />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
