import React, { useEffect } from 'react';
import { X, ChevronRight, Heart, Truck, User, LogOut, Gift } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/lib/catalog';
import { BrandLockup } from '@/components/brand/BrandSeal';

const STATIC = [
  { to: '/gift-hampers', label: 'Gift Hampers' },
  { to: '/festival-collections', label: 'Festive Gift Hampers' },
  { to: '/wedding-gifts', label: 'Wedding Gifts' },
  { to: '/corporate-gifts', label: 'Corporate Gifts' },
  { to: '/offers', label: 'Offers' },
];

export default function HamburgerDrawer({ open, onClose }) {
  const { user, isAuthed, logout } = useAuth();
  const { data: cats } = useCategories();
  const nav = useNavigate();

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
          <BrandLockup to="/" sealSize={42} compact />
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
                  nav('/login');
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
              className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-cream-300/80 text-brand-900 font-medium text-[13.5px] transition-colors"
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
              className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-cream-300/80 text-brand-900 font-medium text-[13.5px] transition-colors sk-tap-target"
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
