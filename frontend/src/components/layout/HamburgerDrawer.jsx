import React from 'react';
import { X, ChevronRight, Heart, Truck, User, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const CATS = [
  { to: '/category/dry-fruits', label: 'Dry Fruits' },
  { to: '/category/nuts', label: 'Nuts' },
  { to: '/category/seeds', label: 'Seeds' },
  { to: '/category/dates', label: 'Dates' },
  { to: '/category/berries', label: 'Berries' },
  { to: '/gift-hampers', label: 'Gift Hampers' },
  { to: '/wedding-gifts', label: 'Wedding Gifts' },
  { to: '/corporate-gifts', label: 'Corporate Gifts' },
  { to: '/festival-collections', label: 'Festival Collections' },
  { to: '/offers', label: 'Offers' },
];

export default function HamburgerDrawer({ open, onClose }) {
  const { user, isAuthed, logout } = useAuth();
  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 bg-black/40 z-50 transition-opacity md:hidden ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <aside className={`fixed left-0 top-0 h-full w-[86%] max-w-[380px] bg-white z-50 shadow-2xl transform transition-transform md:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-line">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-brand-900 grid place-items-center text-cream-300 font-display">S</div>
            <div>
              <div className="font-display font-bold text-brand-900">SUKHMAL</div>
              <div className="text-[9px] tracking-[.22em] text-brand-700">DRY FRUITS KORNER</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close"><X size={22} /></button>
        </div>

        {/* Account block */}
        <div className="p-4 border-b border-line">
          {isAuthed ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-brand-900">Hi, {user.displayName}</div>
                <div className="text-[12px] text-ink-500">{user.email || user.phone}</div>
              </div>
              <button onClick={() => { logout(); onClose(); }} className="sk-btn-ghost text-[13px]"><LogOut size={14} /> Log out</button>
            </div>
          ) : (
            <Link onClick={onClose} to="/login" className="sk-btn-primary w-full"><User size={16} /> Login / Sign Up</Link>
          )}
        </div>

        <div className="p-4 border-b border-line grid grid-cols-2 gap-3">
          <Link onClick={onClose} to="/wishlist" className="sk-btn-outline text-sm !py-2"><Heart size={14} /> Wishlist</Link>
          <Link onClick={onClose} to="/track-order" className="sk-btn-outline text-sm !py-2"><Truck size={14} /> Track Order</Link>
        </div>

        <nav className="p-2">
          {CATS.map((c) => (
            <Link key={c.to} onClick={onClose} to={c.to} className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-cream-200 text-brand-900 font-medium">
              {c.label}<ChevronRight size={16} className="text-ink-400" />
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
