import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, Menu, X, User, LogOut } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { BrandLockup, GiftBasketIcon } from '@/components/brand/BrandSeal';

export default function Header({ onOpenDrawer }) {
  const { count } = useCart();
  const { user, isAuthed, logout } = useAuth();
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
    <header className="bg-white/95 backdrop-blur-md border-b border-line">
      {/* Mobile + tablet (&lt; lg / 1024): hamburger | compact logo | search + cart */}
      <div className="lg:hidden relative flex items-center h-16 px-3 sm:px-4">
        <button
          type="button"
          data-testid="mob-hamburger"
          onClick={onOpenDrawer}
          className="relative z-10 shrink-0 p-2 -ml-1 text-brand-900 rounded-lg hover:bg-cream-300/60 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} strokeWidth={1.75} />
        </button>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <BrandLockup sealSize={48} compact showTagline={false} />
        </div>

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

      {/* Desktop (≥ lg / 1024) */}
      <div className="hidden lg:block relative">
        <div className="sk-container flex items-center h-[5.35rem] gap-4">
          <BrandLockup sealSize={64} />

          <form
            onSubmit={submitDesktop}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(440px,34vw)] xl:w-[min(620px,44vw)]"
          >
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                data-testid="hdr-search"
                placeholder="Search for dry fruits, nuts, gift hampers..."
                className="sk-input !rounded-full !py-[0.85rem] pr-14 pl-6 !border-[var(--sk-line-strong)] shadow-sk-sm bg-white"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-[var(--sk-espresso)] text-gold-300 grid place-items-center hover:bg-brand-800 transition-colors"
              >
                <Search size={17} strokeWidth={2.25} />
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-3.5">
            {isAuthed ? (
              <>
                <Link
                  to="/account"
                  className="inline-flex items-center gap-1.5 text-brand-900 hover:text-brand-700 transition-colors text-sm font-semibold"
                  aria-label="Account"
                >
                  <User size={20} strokeWidth={1.75} />
                  <span className="hidden xl:inline max-w-[120px] truncate">{user?.displayName || 'Account'}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => { logout(); nav('/login'); }}
                  className="inline-flex items-center text-brand-900 hover:text-brand-700 transition-colors"
                  aria-label="Log out"
                >
                  <LogOut size={20} strokeWidth={1.75} />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-brand-900 hover:text-brand-700 transition-colors text-sm font-semibold"
              >
                <User size={20} strokeWidth={1.75} /> Login
              </Link>
            )}
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
              className="sk-btn-hamper"
            >
              <GiftBasketIcon size={17} className="text-gold-400" />
              Build Your Own Hamper
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
          className={`relative bg-white border-b border-line shadow-sk-lg transition-transform duration-300 ease-out ${
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
              className="shrink-0 h-9 px-3.5 rounded-full bg-[var(--sk-espresso)] text-white text-sm font-semibold"
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
