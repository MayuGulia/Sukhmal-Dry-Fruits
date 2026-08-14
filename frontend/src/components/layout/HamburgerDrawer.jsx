import React, { useEffect } from 'react';
import { X, ChevronRight, Heart, Truck, User, LogOut, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/lib/catalog';

const STATIC = [
  { to: '/gift-hampers', label: 'Gift Hampers' },
  { to: '/wedding-gifts', label: 'Wedding Gifts' },
  { to: '/corporate-gifts', label: 'Corporate Gifts' },
  { to: '/festival-collections', label: 'Festival Collections' },
  { to: '/offers', label: 'Offers' },
];

function BrandSeal({ size = 40 }) {
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

export default function HamburgerDrawer({ open, onClose }) {
  const { user, isAuthed, logout } = useAuth();
  const { data: cats } = useCategories();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden={!open}
        className={`fixed inset-0 z-50 bg-brand-900/50 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`fixed left-0 top-0 h-full w-[86%] max-w-[380px] z-50 flex flex-col bg-cream-100 shadow-sk-lg transition-transform duration-300 ease-out lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-line bg-white/80">
          <div className="flex items-center gap-2.5">
            <BrandSeal size={40} />
            <div>
              <div className="font-display font-bold text-brand-900 leading-tight">SUKHMAL</div>
              <div className="text-[9px] tracking-[.22em] text-brand-700 uppercase font-semibold">Dry Fruits Korner</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 -mr-1 rounded-lg text-brand-900 hover:bg-cream-300/70 transition-colors"
          >
            <X size={22} strokeWidth={1.75} />
          </button>
        </div>

        <div className="px-4 py-3.5 border-b border-line bg-white/60">
          {isAuthed ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-brand-900 truncate">Hi, {user.displayName}</div>
                <div className="text-[12px] text-ink-500 truncate">{user.email || user.phone}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="sk-btn-ghost text-[13px] shrink-0"
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
          ) : (
            <Link onClick={onClose} to="/login" className="sk-btn-primary w-full">
              <User size={16} /> Login / Sign Up
            </Link>
          )}
        </div>

        <div className="px-4 py-3 border-b border-line grid grid-cols-2 gap-2.5">
          <Link onClick={onClose} to="/wishlist" className="sk-btn-outline text-sm !py-2.5">
            <Heart size={14} /> Wishlist
          </Link>
          <Link onClick={onClose} to="/track-order" className="sk-btn-outline text-sm !py-2.5">
            <Truck size={14} /> Track Order
          </Link>
        </div>

        {isAuthed && (
          <div className="px-4 py-2 border-b border-line">
            <Link
              onClick={onClose}
              to="/account"
              className="flex items-center gap-2.5 px-1 py-2.5 text-brand-900 font-medium hover:text-brand-700"
            >
              <User size={18} strokeWidth={1.75} /> Account
            </Link>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-2 py-2">
          <div className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-[.18em] uppercase text-gold-400">
            Categories
          </div>
          {(cats || []).map((c) => (
            <Link
              key={c.slug}
              onClick={onClose}
              to={`/category/${c.slug}`}
              className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-cream-300/80 text-brand-900 font-medium transition-colors"
            >
              {c.name}
              <ChevronRight size={16} className="text-ink-400" />
            </Link>
          ))}
          <div className="mx-3 my-2 border-t border-line" />
          {STATIC.map((c) => (
            <Link
              key={c.to}
              onClick={onClose}
              to={c.to}
              className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-cream-300/80 text-brand-900 font-medium transition-colors"
            >
              {c.label}
              <ChevronRight size={16} className="text-ink-400" />
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-line bg-white/90 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Link
            onClick={onClose}
            to="/build-hamper/budget"
            className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-brand-900 text-white text-sm font-semibold py-3.5 px-4 border border-gold-500/70 shadow-sk-md hover:bg-brand-800 transition-colors"
            data-testid="drawer-build-hamper"
          >
            <Gift size={18} className="text-gold-400" /> Build Your Own Hamper
          </Link>
        </div>
      </aside>
    </>
  );
}
